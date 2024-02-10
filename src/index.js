/**
 * Main
 */
const assert = require('assert').strict;
const chalk = require('chalk');
const cheerio = require('cheerio');
const { convertChangesToXML, diffLines } = require('diff');
const FormData = require('form-data');
const fs = require('node:fs');
const got = require('got');
const pkg = require('../package.json');
const tough = require('tough-cookie');

const diffPrefix = {
  red: '- ',
  green: '+ ',
  grey: '  '
};

const cThrowAndExit = true;

class Twoday {
  constructor(platform, userOptions = {}) {
    const defaults = { delay: 100, agreedVersion: '20190210a', silent: false };
    const options = Object.assign({}, defaults, userOptions);
    assert.ok(typeof platform === 'string', new Error('Param "platform" must be a string!'));
    assert.ok(typeof options.agreedVersion === 'string', new Error('User option "agreedVersion" must be a string!'));
    assert.ok(typeof options.delay === 'number', new Error('User option "delay" must be a number!'));
    assert.ok(typeof options.silent === 'boolean', new Error('User option "silent" must be a boolean!'));

    this.platform = platform.toLowerCase(); // dev | prod
    this.fullDomain = `twoday${this.#getDomain()}`;
    this.baseUrl = `https://${this.fullDomain}`;
    this.layout = {};
    this.static = { alias: null, resType: null, url: null };
    this.delay = Math.abs(options.delay); // ms
    this.silent = options.silent; // true=no console messages
    this.version = pkg.version;

    const cookie = tough.Cookie;
    const agreed = cookie.parse(
      `agreed=${options.agreedVersion}; Domain=.${this.fullDomain}; Path=/; SameSite=None; Secure;`
    );
    this.cookieJar = new tough.CookieJar();
    this.cookieJar.setCookieSync(agreed, this.baseUrl);
    this.got = got.extend({
      allowGetBody: true,
      cookieJar: this.cookieJar,
      methodRewriting: false,
      prefixUrl: ''
    });
    if (!this.silent) console.log(`Twoday v${this.version} on ${this.platform}.`);
  }

  #checkLoggedIn() {
    try {
      const cookies = this.cookieJar.serializeSync().cookies;
      return cookies[2].key === 'avLoggedIn' && cookies[2].value === '1';
    } catch (err) {
      this.#handleError('Must login before!');
    }
  }

  delayNextPromise() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  async delayed(gotPromise) {
    const result = await Promise.all([gotPromise, this.delayNextPromise()]);
    return result[0];
  }

  #getDomain() {
    switch (this.platform) {
      case 'dev':
        return '-test.net';
      case 'prod':
        return '.net';
      default:
        this.#handleError(`Unknown platform code: "${this.platform}". Must be "dev" or "prod"!`);
    }
  }

  getAliasDomain(alias) {
    if (!alias) throw new Error('Alias must not be empty!');
    return `https://${alias}.${this.fullDomain}`;
  }

  async getStaticUrl(alias, resType) {
    try {
      if (alias !== this.static.alias || resType !== this.static.resType) {
        const iconUrl = `${this.getAliasDomain(alias)}/images/icon`;
        this.static.alias = alias;
        this.static.resType = resType;
        const res = await this.delayed(this.got.get(iconUrl));
        const staticURL = `${res.url.split('/').splice(0, 4).join('/')}/`;
        this.static.url = resType ? `${staticURL}${resType}/` : staticURL;
      }
      return this.static.url;
    } catch (err) {
      return null;
    }
  }

  #getSecretKey(data) {
    const $ = cheerio.load(data);
    return $('[name="secretKey"]').val();
  }

  fixURL(url) {
    return url.startsWith('//') ? `https:${url}` : url;
  }

  #handleError(text, err = null, throwAndExit = false) {
    const message = `${text}${err ? ' --> ' + err.toString() : ''}`;
    console.log(chalk.red(message));
    if (throwAndExit) {
      console.log(chalk.red('Process halted.'));
      process.exit(1);
    }
  }

  async login() {
    try {
      if (typeof process.env.USER === 'undefined' || typeof process.env.PASSWORD === 'undefined')
        this.#handleError('Missing Twoday credentials in process.env.USER/PASSWORD', null, cThrowAndExit);

      const loginUrl = `${this.baseUrl}/members/login`;
      let response = await this.delayed(this.got.get(loginUrl));

      response = await this.delayed(
        this.got.post(loginUrl, {
          form: {
            secretKey: this.#getSecretKey(response.body),
            popup: '',
            step: '',
            isuser: 1,
            name: process.env.USER,
            password: process.env.PASSWORD,
            remember: 1,
            login: 'Anmelden'
          }
        })
      );

      if (!this.silent) console.log(`Login to ${this.fullDomain} successful (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`${this.fullDomain} login failed`, err, cThrowAndExit);
    }
  }

  async logout() {
    try {
      const response = await this.delayed(
        this.got.get('members/logout', {
          prefixUrl: this.baseUrl
        })
      );

      if (!this.silent) console.log(`Logout of ${this.fullDomain} successful (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`${this.fullDomain} logout failed`);
    }
  }

  async getValidHoptypes() {
    if (this.validHoptypes) return this.validHoptypes;
    try {
      const codeUrl = 'https://gitlab.com/api/v4/projects/8966097/repository/tree?path=code&per_page=100';
      const body = await this.got.get(codeUrl).json();
      this.validHoptypes = body.reduce((all, item) => {
        if (item.type === 'tree') all.push(item.name.toLowerCase());
        return all;
      }, []);
      return this.validHoptypes;
    } catch (err) {
      this.#handleError('getValidHoptypes failed', err, cThrowAndExit);
    }
  }

  async isValidHoptype(skinName) {
    const hoptypes = await this.getValidHoptypes();
    const skinHoptype = skinName.split('.')[0].toLowerCase();
    return {
      valid: hoptypes.includes(skinHoptype),
      prototype: skinHoptype,
      name: skinName.slice(skinHoptype.length + 1)
    };
  }

  async getMemberships() {
    try {
      this.#checkLoggedIn();

      const response = await this.delayed(
        this.got.get('members/memberships', {
          prefixUrl: this.baseUrl
        })
      );

      const $ = cheerio.load(response.body);
      let adminBlogs = [];
      $('.listItem').each((_index, el) => {
        let $el = $(el);
        let authLevel = $el
          .find('.listItemLeft')
          .text()
          .match(/Status: (.*)\s/)[1];
        if (authLevel === 'Owner' || authLevel === 'Administrator') {
          adminBlogs.push(
            $el
              .find('.listItemRight a')
              .eq(0)
              .attr('href')
              .match(/\/\/(.*?)\.twoday\./)[1]
          );
        }
      });

      return adminBlogs;
    } catch (err) {
      this.#handleError('getMemberships failed', err, cThrowAndExit);
    }
  }

  async #fetchItems(alias, hoptype, returnItemsOnPage) {
    try {
      this.#checkLoggedIn();

      const resUrl = `${this.getAliasDomain(alias)}/${hoptype}/?page=`;
      let response = await this.delayed(this.got.get(`${resUrl}0`));
      let $ = cheerio.load(response.body);
      let allItems = returnItemsOnPage($);
      let maxPage = 0;
      const $pageNav = $('.pageNavSummary:first'); // e.g. "zeige 1-20 (von 50)"
      if ($pageNav) {
        const totalItems = parseInt($pageNav.text().split(' ').pop());
        maxPage = Math.floor(totalItems / 20);
      }

      for (let page = 1; page <= maxPage; page++) {
        response = await this.delayed(this.got.get(`${resUrl}${page}`));
        allItems = allItems.concat(returnItemsOnPage(cheerio.load(response.body)));
      }
      return allItems;
    } catch (err) {
      this.#handleError(`#fetchItems failed for "${alias}" @ "${hoptype}"`, err, cThrowAndExit);
    }
  }

  async getMembers(alias) {
    const returnMembers = $$ =>
      $$('.listItemLeft')
        .map((_i, el) => {
          const $$el = $$(el);
          const role = $$el.find('span').eq(0).text().split(': ')[1];
          const alias = $$el.find('h4').text();
          const url = this.fixURL($$el.find('p>a').attr('href') || '');
          return { alias, role, url };
        })
        .get();

    return await this.#fetchItems(alias, 'members', returnMembers);
  }

  async getModifiedSkins(alias) {
    try {
      this.#checkLoggedIn();

      const prefixUrl = await this.getActiveLayoutUrl(alias);
      const response = await this.delayed(this.got.get('skins/modified', { prefixUrl }));

      const $ = cheerio.load(response.body);
      const modSkins = $('.skin>a');
      if (!modSkins) return [];
      return modSkins
        .map(function (_i, el) {
          const $el = $(el);
          return { name: $el.attr('name'), url: $el.attr('href') };
        })
        .get();
    } catch (err) {
      this.#handleError(`getModifiedSkins from "${prefixUrl}" failed`, err, cThrowAndExit);
    }
  }

  async isModifiedSkin(alias, skinName) {
    try {
      const result = await this.isValidHoptype(skinName);
      const modifiedSkins = await this.getModifiedSkins(alias);

      const filtered = modifiedSkins.filter(skin => {
        const prototype = skin.name.split('.')[0].toLowerCase();
        const name = skin.name.slice(prototype.length + 1);
        return result.prototype === prototype && result.name === name;
      });

      result.isModified = !!filtered.length;
      result.url = result.isModified ? filtered[0].url : '';
      return result;
    } catch (err) {
      this.#handleError(`isModifiedSkin "${alias}/${skinName}" failed`, err, cThrowAndExit);
    }
  }

  async #getLayoutData(alias) {
    this.#checkLoggedIn();

    const response = await this.delayed(
      this.got.get('layouts/main', {
        prefixUrl: `${this.getAliasDomain(alias)}`
      })
    );

    const $ = cheerio.load(response.body);
    const layoutLinks = $('a[href*="download"]');
    const url = $('.level2 a.active').eq(0).attr('href');
    const activeLayoutUrl = this.fixURL(url.split('/').slice(0, -1).join('/'));

    this.layout[alias] = {
      activeLayoutUrl,
      activeLayoutName: activeLayoutUrl.split('/').pop(),
      layoutNames: Array.from(layoutLinks).map(a => a.attribs.href.match(/layouts\/([\w-]*)\//)[1])
    };
    return this.layout[alias];
  }

  async getLayout(alias, refresh = false) {
    if (this.layout[alias] && !refresh) return this.layout[alias];
    try {
      return await this.#getLayoutData(alias);
    } catch (err) {
      this.#handleError(`getLayout from "${alias}" failed`, err, cThrowAndExit);
    }
  }

  async getActiveLayoutUrl(alias) {
    const { activeLayoutUrl } = await this.getLayout(alias);
    return activeLayoutUrl;
  }

  async getActiveLayoutName(alias) {
    const { activeLayoutName } = await this.getLayout(alias);
    return activeLayoutName;
  }

  async getLayoutNames(alias) {
    const { layoutNames } = await this.getLayout(alias);
    return layoutNames;
  }

  async useLayout(alias, layoutName = '') {
    try {
      assert.ok(typeof layoutName === 'string' && layoutName.length, new Error('Missing layout name!'));
      layoutName = layoutName.toLowerCase();

      const layout = await this.getLayout(alias);
      assert.ok(layout.layoutNames.includes(layoutName), new Error(`Layout "${alias}/${layoutName}" does not exist!`));

      if (layout.activeLayoutName !== layoutName) {
        let parts = layout.activeLayoutUrl.split('/');
        parts.splice(-1, 1, layoutName);
        layout.activeLayoutUrl = parts.join('/');
        layout.activeLayoutName = layoutName;
      }

      return layout;
    } catch (err) {
      this.#handleError(`useLayout "${alias}/${layoutName || '?'}" failed`, err, cThrowAndExit);
    }
  }

  async getSkin(skin) {
    try {
      this.#checkLoggedIn();

      skin.url = this.fixURL(skin.url);
      const response = await this.delayed(this.got.get(skin.url));

      const $ = cheerio.load(response.body);
      return Object.assign(skin, {
        secretKey: $('[name="secretKey"]').val(),
        action: $('[name="action"]').val(),
        key: $('[name="key"]').val(),
        skinset: $('[name="skinset"]').val(),
        module: $('[name="module"]').val(),
        title: $('[name="title"]').val(),
        description: $('[name="description"]').val(),
        skin: $('[name="skin"]').val(),
        save: $('[name="save"]').val()
      });
    } catch (err) {
      this.#handleError(`getSkin "${skin.name}" failed`, err, cThrowAndExit);
    }
  }

  async postSkin(skin) {
    try {
      this.#checkLoggedIn();

      const data = Object.assign({}, skin);
      delete data.name;
      delete data.url;

      return await this.delayed(
        this.got.post(skin.url, {
          form: data
        })
      );
    } catch (err) {
      this.#handleError(`postSkin "${skin.name}" failed`, err, cThrowAndExit);
    }
  }

  /**
   * Diffs 2 strings per line and displays the variations: red=deleted, green=added, grey=unchanged
   * @param {String} h header: e.g. title | description | skin
   * @param {String} s1 old value
   * @param {String} s2 new value
   * @returns {tDiffResult}
   */
  evalDiff(h, s1, s2) {
    const header = `[${h}]`;
    const differ = diffLines(s1, s2);
    const itemChanged = differ.filter(part => part.added || part.removed).length;
    let text;

    if (itemChanged) {
      text = `${header} length was=${s1.length}, ${s1.length === s2.length ? 'now same' : 'now=' + s2.length}:`;
      process.stdout.write(chalk.cyan(text));
      process.stdout.write('\n');
      differ.forEach(part => {
        const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        process.stdout.write(chalk[color](diffPrefix[color]));
        process.stdout.write(chalk[color](part.value));
        process.stdout.write('\n');
      });
    } else {
      text = `${header} is unchanged.`;
      process.stdout.write(chalk.grey(text));
      process.stdout.write('\n');
    }
    return { itemChanged, text, diffs: convertChangesToXML(differ) };
  }

  diffSkin(skinName, skin1, skin2) {
    try {
      this.#validateOptions(skin1);
      delete skin1.diff;
      delete skin1.name;
      let diffResults = [];
      for (let field of Object.keys(skin1)) {
        diffResults.push(this.evalDiff(field, skin1[field], skin2[field] || ''));
      }
      return {
        skinName,
        skinChanged: !!diffResults.filter(result => result.itemChanged).length,
        results: diffResults
      };
    } catch (err) {
      this.#handleError(`diffSkin of ${skinName} failed`, err, cThrowAndExit);
    }
  }

  #validateOptions(options) {
    assert.ok(typeof options === 'object', new Error('Options must be an object!'));
    assert.ok(
      Object.keys(options).filter(key => !['name', 'title', 'description', 'skin', 'diff'].includes(key)).length === 0,
      new Error('Invalid option key!')
    );
  }

  async updateSkin(alias, skinName, options) {
    try {
      this.#validateOptions(options);

      const { isModified, url } = await this.isModifiedSkin(alias, skinName);
      if (!isModified) return createSkin(alias, skinName, options);

      const oldSkin = await this.getSkin({
        name: skinName,
        url
      });

      if (options.diff) {
        delete options.diff;

        let hasChanged = false;
        for (let option of Object.entries(options)) {
          let [field, newValue] = option;
          if (oldSkin[field] != newValue) {
            this.evalDiff(field, oldSkin[field], newValue);
            hasChanged = true;
          }
        }

        if (!hasChanged) {
          if (!this.silent) console.log(chalk.gray(`Skipping update of skin ${skin.name} (unchanged).`));
          return;
        }
      }

      let response = await this.postSkin(Object.assign(oldSkin, options));
      if (!this.silent)
        console.log(`Skin "${alias}/${skinName}" successfully updated (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`Error while updating skin "${alias}/${skinName}"`, err);
    }
  }

  async deleteSkin(alias, skinName) {
    try {
      this.#checkLoggedIn();

      const { isModified, prototype, name } = await this.isModifiedSkin(alias, skinName);
      if (!isModified) throw new Error('Skin is not a modified/deletable skin!');

      const layoutUrl = await this.getActiveLayoutUrl(alias);

      const deleteUrl = `${layoutUrl}/skins/${prototype}/${name}/delete`;
      let response = await this.delayed(this.got.get(deleteUrl));

      response = await this.delayed(
        this.got.post(deleteUrl, {
          form: {
            secretKey: this.#getSecretKey(response.body),
            remove: 'Löschen'
          }
        })
      );
      if (!this.silent)
        console.log(`Skin "${alias}/${skinName}" successfully deleted (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`Error while deleting skin "${alias}/${skinName}"`, err);
    }
  }

  async createSkin(alias, skinName, options = {}) {
    try {
      this.#validateOptions(options);

      const { valid } = await this.isValidHoptype(skinName);
      if (!valid) throw new Error(`New skin does not have a valid Hoptype!`);

      const layoutUrl = await this.getActiveLayoutUrl(alias);

      const data = await this.getSkin({
        name: skinName,
        url: `${layoutUrl}/skins/edit?key=${skinName}&skinset=&action=`
      });

      delete options.diff;
      const defaults = {
        title: `${skinName}`,
        description: `${skinName}`,
        skin: `<p><!-- new skin filler text -->Bacon ipsum dolor amet minim anim duis cillum, esse aliquip non chislic leberkas rump drumstick ut. Burgdoggen hamburger bresaola turkey, chicken commodo chislic anim.</p>\n`
      };
      let response = await this.postSkin(Object.assign(data, defaults, options));
      if (!this.silent)
        console.log(`Skin "${alias}/${skinName}" successfully created (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`Error while creating skin "${alias}/${skinName}"`, err);
    }
  }

  async listItems(alias, resType) {
    const returnResources = $$ =>
      $$('.leftCol')
        .map((_i, el) => {
          const $$el = $$(el);
          const parts = $$el.text().split('/');
          const name = parts[0].match(/name="(.*?)"/)[1];
          const mime = parts[1].split(', ')[0].split('-').pop().trim();
          const url = this.fixURL($$el.next().find('a').eq(0).attr('href'));
          return { name, mime, url };
        })
        .get();

    try {
      if (!['files', 'images'].includes(resType)) throw new Error('Param "resType" must be "files" or "images".');
      return await this.#fetchItems(alias, resType, returnResources);
    } catch (err) {
      this.#handleError(`Error while getting the list of "${resType}" for "${alias}"`, err, cThrowAndExit);
    }
  }

  async hasItem(alias, resType, resName) {
    try {
      this.#checkLoggedIn();

      const resUrl = `${this.getAliasDomain(alias)}/${resType}/${resName}`;
      await this.delayed(this.got.get(resUrl));
      return true;
    } catch (err) {
      return false;
    }
  }

  async downloadItems(listItems, path) {
    try {
      assert.ok(Array.isArray(listItems), new Error('listItems param must be an array!'));
      if (!listItems.length) {
        if (!this.silent) console.log('Empty listItems: got nothing to download.');
        return;
      }
      assert.ok(typeof listItems[0] === 'object', new Error('listItems array must be contain objects!'));
      const keys = Object.keys(listItems[0]);
      assert.ok(
        keys.includes('name') && keys.includes('url'),
        new Error('listItems objects must have properties "name" and "url"!')
      );

      for (const item of listItems) {
        const downloadPath = `${path}${item.url.slice(item.url.lastIndexOf('/'))}`;
        const fileStream = fs.createWriteStream(downloadPath);
        const downloadItemAsBuffer = await this.delayed(this.got.get(item.url).buffer());
        fileStream.write(downloadItemAsBuffer);
        fileStream.end();
        if (!this.silent) console.log(`Download of "${item.name}" completed.`);
      }
      if (!this.silent) console.log(`Finished downloading ${listItems.length} items.`);
    } catch (err) {
      this.#handleError('Error while downloading items', err, cThrowAndExit);
    }
  }

  async deleteItem(alias, resType, resName) {
    try {
      this.#checkLoggedIn();

      const deleteUrl = `${this.getAliasDomain(alias)}/${resType}/${resName}/delete`;
      let response = await this.delayed(this.got.get(deleteUrl));

      response = await this.delayed(
        this.got.post(deleteUrl, {
          form: {
            secretKey: this.#getSecretKey(response.body),
            remove: 'Löschen'
          }
        })
      );
      if (!this.silent)
        console.log(`File "${alias}/${resName}" successfully deleted (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`Error while deleting ${resType.slice(0, -1)} "${alias}/${resName}"`, err, cThrowAndExit);
    }
  }

  async listFiles(alias) {
    return await this.listItems(alias, 'files');
  }

  async hasFile(alias, fileName) {
    return await this.hasItem(alias, 'files', fileName);
  }

  async deleteFile(alias, fileName) {
    return await this.deleteItem(alias, 'files', fileName);
  }

  async createFile(alias, file) {
    try {
      this.#checkLoggedIn();

      const createUrl = `${this.getAliasDomain(alias)}/files/create`;
      let response = await this.delayed(this.got.get(createUrl));

      const form = new FormData();
      form.append('secretKey', this.#getSecretKey(response.body));
      form.append('rawfile', fs.createReadStream(file.path));
      form.append('alias', file.name);
      form.append('description', file.description);
      form.append('save', 'Sichern');
      response = await this.delayed(
        this.got.post(createUrl, {
          body: form
        })
      );
      if (!this.silent)
        console.log(`File "${alias}/${file.name}" successfully created (statusCode=${response.statusCode}).`);
      const $ = cheerio.load(response.body);
      return $('td>b').eq(0).text();
    } catch (err) {
      this.#handleError(`Error while creating file "${alias}/${file.name}"`, err, cThrowAndExit);
    }
  }

  async updateFile(alias, file) {
    try {
      const fileExists = await this.hasFile(alias, file.name);
      if (fileExists) await this.deleteFile(alias, file.name);
      return await this.createFile(alias, file);
    } catch (err) {
      this.#handleError(`Error while updating file "${alias}/${file.name}"`, err, cThrowAndExit);
    }
  }

  async downloadFiles(alias, path) {
    try {
      const files = await td.listFiles(alias);
      await td.downloadItems(files, path);
    } catch (err) {
      this.#handleError(`Error while downloading files for "${alias}"`, err, cThrowAndExit);
    }
  }

  async listImages(alias) {
    return await this.listItems(alias, 'images');
  }

  async hasImage(alias, imgName) {
    return await this.hasItem(alias, 'images', imgName);
  }

  async deleteImage(alias, imgName) {
    return await this.deleteItem(alias, 'images', imgName);
  }

  async createImage(alias, image) {
    try {
      this.#checkLoggedIn();

      const defaults = {
        alias: '',
        path: '',
        url: '',
        alttext: '',
        addToTopic: '',
        topic: '',
        resizeto: 'no',
        width: '400',
        height: '400',
        layout: ''
      };
      const param = Object.assign(defaults, image);
      if (!param.path && !param.url) throw new Error('New image must have an image file path or an URL!');
      const imgName = param.alias || (param.path || param.url).split('/').pop();

      const layout = param.layout ? `/layouts/${param.layout}` : '';
      const createUrl = `${this.getAliasDomain(alias)}${layout}/images/create`;
      let response = await this.delayed(this.got.get(createUrl));

      const form = new FormData();
      form.append('secretKey', this.#getSecretKey(response.body));
      form.append('rawimage', param.path ? fs.createReadStream(param.path) : '');
      form.append('url', param.url || '');
      form.append('alias', param.alias);
      form.append('alttext', param.alttext); // img description and img alt="..."
      if (!layout) {
        form.append('addToTopic', param.addToTopic);
        form.append('topic', param.topic);
      }
      form.append('resizeto', param.resizeto);
      form.append('width', param.width);
      form.append('height', param.height);
      form.append('save', 'Sichern');
      response = await this.delayed(
        this.got.post(createUrl, {
          body: form
        })
      );
      if (!this.silent)
        console.log(`${layout ? 'Layout ' : ''}Image "${alias}/${imgName}" successfully created (statusCode=${response.statusCode}).`);
      const $ = cheerio.load(response.body);
      return $('td>b').eq(0).text();
    } catch (err) {
      this.#handleError(`Error while creating file "${alias}/${imgName}"`, err, cThrowAndExit);
    }
  }

  async updateImage(alias, image) {
    try {
      this.#checkLoggedIn();

      const defaults = {
        alias: '',
        path: '',
        url: '',
        resizeto: 'no',
        width: '400',
        height: '400'
      };
      const param = Object.assign(defaults, image);
      const imgAlias = param.alias || '';
      delete param.alias;

      if (!imgAlias) throw new Error('Image alias is missing!');
      if (!param.path && !param.url) throw new Error('Replacing image must have an image file path or an URL!');

      const replaceUrl = `${this.getAliasDomain(alias)}/images/${imgAlias}/replace`;
      let response = await this.delayed(this.got.get(replaceUrl));

      const form = new FormData();
      form.append('secretKey', this.#getSecretKey(response.body));
      form.append('rawimage', param.path ? fs.createReadStream(param.path) : '');
      form.append('url', param.url || '');
      form.append('resizeto', param.resizeto);
      form.append('width', param.width);
      form.append('height', param.height);
      form.append('save', 'Sichern');
      response = await this.delayed(
        this.got.post(replaceUrl, {
          body: form
        })
      );
      if (!this.silent)
        console.log(`Image "${alias}/${imgAlias}" successfully replaced (statusCode=${response.statusCode}).`);
      const $ = cheerio.load(response.body);
      return $('td>b').eq(0).text();
    } catch (err) {
      this.#handleError(`Error while replacing image "${alias}/${imgAlias}"`, err, cThrowAndExit);
    }
  }

  async downloadImages(alias, path) {
    try {
      const images = await td.listImages(alias);
      await td.downloadItems(images, path);
    } catch (err) {
      this.#handleError(`Error while downloading images for "${alias}"`, err, cThrowAndExit);
    }
  }

  getNiceUrl(url) {
    url = url.toLowerCase();
    url = url.replace(/ü/g, 'ue');
    url = url.replace(/ä/g, 'ae');
    url = url.replace(/ö/g, 'oe');
    url = url.replace(/Ü/g, 'Ue');
    url = url.replace(/Ä/g, 'Ae');
    url = url.replace(/Ö/g, 'Oe');
    url = url.replace(/ß/g, 'ss');
    url = url.replace(/[^a-z0-9 -]/g, '');
    url = url.replace(/\s/g, '-');
    url = url.replace(/-+/g, '-');
    // max 70 Chars
    url = url.substring(0, 70);
    // remove - from start and end of String because not very nice
    url = url.replace(/^-/, '');
    url = url.replace(/-$/, '');
    return url;
  }

  #validateStory(story) {
    assert.ok(typeof story === 'object', new Error('Story param must be an object!'));
    assert.ok(
      Object.keys(story).filter(
        key => !['title', 'niceurl', 'body', 'id', 'topic', 'publish', 'action', 'event'].includes(key)
      ).length === 0,
      new Error('Invalid story param key!')
    );
    if (story.event === 'create') {
      // new story
      assert.ok(story.title, new Error('Story title must not be empty on create!'));
      story.niceurl = this.getNiceUrl(story.niceurl ? story.niceurl : story.title);
    } else {
      // update existing story
      assert.ok(story.niceurl || story.id, new Error('Story must have niceurl or id on update!'));
    }

    if (!story.action) story.action = 'save';
    else if (!['save', 'publish'].includes(story.action))
      this.#handleError('Story action param must be "save" or "publish".', null, cThrowAndExit);
  }

  async listStories(alias, fromPage = 0, toPage) {
    try {
      const info = await this.getInfo(alias);
      const maxPage = Math.floor(info.stories / 20);
      if (typeof toPage === 'undefined' || toPage > maxPage) toPage = maxPage;
      if (fromPage > toPage) throw new Error(`fromPage (=${fromPage}) must not be greater than toPage (=${toPage})`);
      const storiesPageUrl = `${this.getAliasDomain(alias)}/stories/?page=`;

      let stories = [];
      for (let i = fromPage; i <= toPage; i++) {
        const response = await this.delayed(this.got.get(`${storiesPageUrl}${i}`));
        const $ = cheerio.load(response.body);

        $('tbody').each((_index, el) => {
          let $el = $(el);
          let title = $el.find('tr>td>b').text().trim();
          let leftColText = $el.find('td.leftCol').text().trim();
          let id = leftColText.match(/story id="(\d*)"/)[1];
          let createDate = leftColText.split('\n')[2].slice(-16);
          stories.push({ id, createDate, title });
        });
      }
      return { fromPage, toPage, maxPage, stories, total: info.stories };
    } catch (err) {
      this.#handleError(`Error while getting story list of "${alias}"`, err, cThrowAndExit);
    }
  }

  async getStory(alias, id) {
    try {
      const storyUrl = `${this.getAliasDomain(alias)}/stories/${id}`;
      return await this.delayed(this.got.get(storyUrl));
    } catch (err) {
      return null;
    }
  }

  async hasStory(alias, id) {
    const response = await this.getStory(alias, id);
    return !!response;
  }

  async createStory(alias, story) {
    try {
      this.#checkLoggedIn();

      story.event = 'create';
      this.#validateStory(story);

      const storyCreateUrl = `${this.getAliasDomain(alias)}/stories/create`;
      let response = await this.delayed(this.got.get(storyCreateUrl));

      const form = {
        secretKey: this.#getSecretKey(response.body),
        content_title: story.title,
        modNiceUrls_urlid: story.niceurl,
        content_text: story.body || '<p>Hello World!</p>',
        addToFront: '1',
        checkbox_addToFront: 'addToFront',
        addToTopic: '',
        topic: story.topic || '',
        editableby: '0',
        discussions: '1',
        checkbox_discussions: 'discussions',
        createtime: story.publish || ''
      };
      form[story.action] = true; // save || publish

      response = await this.delayed(this.got.post(storyCreateUrl, { form }));
      const $ = cheerio.load(response.body);
      const newStoryID = $('.leftCol')
        .eq(0)
        .text()
        .match(/story id="(\d+)"/)[1];

      if (!this.silent)
        console.log(
          `Story "${alias}/${story.niceurl}" (id ${newStoryID}) successfully created (statusCode=${response.statusCode}).`
        );
      return { id: newStoryID, niceurl: story.niceurl };
    } catch (err) {
      this.#handleError(`Error while creating story "${alias}/${story.niceurl}"`, err, cThrowAndExit);
    }
  }

  #getStoryParams(data) {
    const $ = cheerio.load(data);
    return {
      secretKey: $('[name="secretKey"]').val(),
      content_title: $('[name="content_title"]').val(),
      modNiceUrls_urlid: $('[name="modNiceUrls_urlid"]').val(),
      content_text: $('[name="content_text"]').val(),
      addToFront: $('[name="addToFront"]').val(),
      addToTopic: $('[name="addToTopic"]').val(),
      editableby: $('[name="editableby"]').val(),
      discussions: $('[name="discussions"]').val(),
      createtime: $('[name="createtime"]').val()
    };
  }

  async updateStory(alias, story) {
    const storyID = story.id || story.niceurl;
    try {
      this.#checkLoggedIn();

      story.event = 'update';
      this.#validateStory(story);

      const storyEditUrl = `${this.getAliasDomain(alias)}/stories/${storyID}/edit`;
      let response = await this.delayed(this.got.get(storyEditUrl));
      const params = this.#getStoryParams(response.body);

      const form = {
        secretKey: params.secretKey,
        content_title: story.title || params.content_title,
        modNiceUrls_urlid: story.niceurl || params.modNiceUrls_urlid,
        content_text: story.body || params.content_text,
        addToFront: params.addToFront,
        checkbox_addToFront: 'addToFront',
        addToTopic: params.addToTopic,
        topic: story.topic || '',
        editableby: params.editableby,
        discussions: params.discussions,
        checkbox_discussions: 'discussions',
        createtime: story.publish || params.createtime
      };
      form[story.action] = true; // save || publish

      response = await this.delayed(this.got.post(storyEditUrl, { form }));

      if (!this.silent)
        console.log(`Story "${alias}/${storyID}" successfully updated (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      this.#handleError(`Error while updating story "${alias}/${storyID}"`, err, cThrowAndExit);
    }
  }

  async getStoryTopics(alias) {
    try {
      const storyTopicsUrl = `${this.getAliasDomain(alias)}/topics`;
      const response = await this.delayed(this.got.get(storyTopicsUrl));

      const $ = cheerio.load(response.body);
      return $('.listItem td>a')
        .map((_i, el) => {
          let $el = $(el);
          return { name: $el.text(), url: $el.attr('href') };
        })
        .get();
    } catch (err) {
      this.#handleError(`Error while reading story topics of "${alias}"`, err, cThrowAndExit);
    }
  }

  async downloadLayout(alias, layout) {
    try {
      this.#checkLoggedIn();

      const downloadUrl = `${this.getAliasDomain(alias)}/layouts/${layout.name}/download`;
      let response = await this.delayed(this.got.get(downloadUrl));

      response = await this.delayed(
        this.got.post(downloadUrl, {
          form: {
            secretKey: this.#getSecretKey(response.body),
            changesonly: true
          }
        })
      );

      const zip = fs.createWriteStream(layout.path);
      zip.write(response.rawBody);
      zip.end();

      if (!this.silent) console.log(`Layout "${alias}/${layout.name}" successfully downloaded.`);
      return true;
    } catch (err) {
      this.#handleError(`Error while downloading layout "${alias}/${layout.name}"`, err, cThrowAndExit);
    }
  }

  async checkUserAlienVersion(alias) {
    try {
      const response = await this.delayed(this.got.get(`${this.getAliasDomain(alias)}`));
      const $ = cheerio.load(response.body);
      const el = $('body')[0];
      return el.attribs['data-version'] || 'N/A';
    } catch (err) {
      this.#handleError(`Error while checking alien version of "${alias}"`, err);
    }
  }

  async getInfo(alias) {
    const filter = {
      de: { m: /erstellt von (.*)/, s: ' am ' },
      en: { m: /created by (.*)/, s: ' on ' }
    };
    try {
      this.#checkLoggedIn();

      const response = await this.delayed(this.got.get(`${this.getAliasDomain(alias)}/manage`));
      const $ = cheerio.load(response.body);

      const createInfo = $('.teaserbody p').eq(1).text().trim();
      const lang = createInfo.startsWith('erstellt') ? 'de' : 'en';
      const [creator, createDate] = createInfo.match(filter[lang].m)[1].split(filter[lang].s);

      const [stories, comments, images, files] = $('.teaserbody strong')
        .map((_i, el) => parseInt($(el).text()))
        .get();

      const diskUsageNumbers = $('.diskusage').eq(0).prev().text().trim().match(/(\d+)/g);

      const usedKB = Number(diskUsageNumbers[0]);

      const diskUsage =
        diskUsageNumbers.length === 2 ? Math.round((usedKB / Number(diskUsageNumbers[1])) * 1000) / 10 : 0;

      const trustedSite = diskUsage === 0;

      return {
        creator,
        createDate,
        stories,
        comments,
        images,
        files,
        diskUsage,
        usedKB,
        trustedSite
      };
    } catch (err) {
      this.#handleError(`Error while getting infos of "${alias}"`, err, cThrowAndExit);
    }
  }
}

exports.Twoday = Twoday;
