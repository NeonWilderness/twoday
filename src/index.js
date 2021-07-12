/**
 * Main
 */
const assert = require('assert').strict;
const chalk = require('chalk');
const cheerio = require('cheerio');
const diff = require('diff');
const FormData = require('form-data');
const fs = require('fs');
const got = require('got');
const pkg = require('../package.json');
const tough = require('tough-cookie');

class Twoday {
  constructor(platform, userOptions = {}) {
    const defaults = { delay: 20, agreedVersion: '20190210a', silent: false };
    const options = Object.assign({}, defaults, userOptions);
    assert.ok(typeof platform === 'string', 'Param "platform" must be a string!');
    assert.ok(typeof options.agreedVersion === 'string', 'User option "agreedVersion" must be a string!');
    assert.ok(typeof options.delay === 'number', 'User option "delay" must be a number!');
    assert.ok(typeof options.silent === 'boolean', 'User option "silent" must be a boolean!');

    this.platform = platform.toLowerCase(); // dev | prod
    this.fullDomain = `twoday.${this.#getDomain()}`;
    this.baseUrl = `https://${this.fullDomain}`;
    this.layoutUrl = {};
    this.delay = Math.abs(options.delay); // ms
    this.silent = options.silent; // true=no console messages

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
    if (!this.silent) console.log(`Twoday v${pkg.version} on ${this.platform}.`);
  }

  checkLoggedIn() {
    try {
      const cookies = this.cookieJar.serializeSync().cookies;
      return cookies[2].key === 'avLoggedIn' && cookies[2].value === '1';
    } catch (err) {
      throw new Error(`Must login before!`);
    }
  }

  delayNextPromise() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  #getDomain() {
    switch (this.platform) {
      case 'dev':
        return 'xyz';
      case 'prod':
        return 'net';
      default:
        throw new Error(`Unknown platform code: "${this.platform}". Must be "dev" or "prod"!`);
    }
  }

  getAliasDomain(alias) {
    if (!alias) throw new Error('Alias must not be empty!');
    return `https://${alias}.${this.fullDomain}`;
  }

  #getSecretKey(data) {
    let $ = cheerio.load(data);
    return $('[name="secretKey"]').val();
  }

  fixURL(url) {
    return url.startsWith('//') ? `https:${url}` : url;
  }

  async login() {
    try {
      if (typeof process.env.USER === 'undefined' || typeof process.env.PASSWORD === 'undefined')
        throw new Error('Missing Twoday credentials in process.env.USER/PASSWORD');

      const loginUrl = `${this.baseUrl}/members/login`;
      let response = await this.got.get(loginUrl);

      response = await this.got.post(loginUrl, {
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
      });

      if (!this.silent) console.log(`Login to ${this.fullDomain} successful (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`${this.fullDomain} login failed --> ${err}`));
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
      console.log(chalk.red(`getValidHoptypes failed --> ${err}`));
      process.exit(1);
    }
  }

  async isValidHoptype(skinName) {
    const hoptypes = await this.getValidHoptypes();
    const skinHoptype = skinName.split('.')[0].toLowerCase();
    return {
      valid: hoptypes.includes(skinHoptype),
      prototype: skinHoptype,
      name: skinName.substr(skinHoptype.length + 1)
    };
  }

  async getMemberships() {
    try {
      this.checkLoggedIn();

      const response = await this.got.get('members/memberships', {
        prefixUrl: this.baseUrl
      });

      const $ = cheerio.load(response.body);
      let adminBlogs = [];
      $('.listItem').each((index, el) => {
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
      throw new Error(`getMemberships failed --> ${err}`);
    }
  }

  async getModifiedSkins(alias) {
    try {
      this.checkLoggedIn();

      const response = await this.got.get('layout/skins/modified', {
        prefixUrl: `${this.getAliasDomain(alias)}`
      });

      const $ = cheerio.load(response.body);
      const modSkins = $('.skin>a');
      if (!modSkins) return [];
      return modSkins
        .map(function (i, el) {
          const $el = $(el);
          return { name: $el.attr('name'), url: $el.attr('href') };
        })
        .get();
    } catch (err) {
      throw new Error(`getModifiedSkins from "${alias}" failed --> ${err}`);
    }
  }

  async isModifiedSkin(alias, skinName) {
    try {
      const result = await this.isValidHoptype(skinName);
      const modifiedSkins = await this.getModifiedSkins(alias);

      const filtered = modifiedSkins.filter(skin => {
        const prototype = skin.name.split('.')[0].toLowerCase();
        const name = skin.name.substr(prototype.length + 1);
        return result.prototype === prototype && result.name === name;
      });

      result.isModified = !!filtered.length;
      result.url = result.isModified ? filtered[0].url : '';
      return result;
    } catch (err) {
      console.log(chalk.red(`isModifiedSkin "${alias}/${skinName}" failed --> ${err}`));
    }
  }

  async getLayoutUrl(alias) {
    if (this.layoutUrl[alias]) return this.layoutUrl[alias];
    try {
      this.checkLoggedIn();

      const response = await this.got.get('layouts/main', {
        prefixUrl: `${this.getAliasDomain(alias)}`
      });

      const $ = cheerio.load(response.body);
      const url = $('.level2 a.active').eq(0).attr('href');
      this.layoutUrl[alias] = this.fixURL(url.split('/').slice(0, -1).join('/'));
      return this.layoutUrl[alias];
    } catch (err) {
      console.log(chalk.red(`getLayoutUrl from "${alias}" failed --> ${err}`));
    }
  }

  async getSkin(skin) {
    try {
      this.checkLoggedIn();

      skin.url = this.fixURL(skin.url);
      const response = await this.got.get(skin.url);

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
      console.log(chalk.red(`getSkin "${skin.name}" failed --> ${err}`));
    }
  }

  async postSkin(skin) {
    try {
      this.checkLoggedIn();

      const data = Object.assign({}, skin);
      delete data.name;
      delete data.url;

      return await this.got.post(skin.url, {
        form: data
      });
    } catch (err) {
      console.log(chalk.red(`postSkin "${skin.name}" failed --> ${err}`));
    }
  }

  /**
   * Diffs 2 strings and displays the variations: red=deleted, green=added, gray=unchanged
   * @param {String} h header: e.g. title | description | skin
   * @param {String} s1 old value
   * @param {String} s2 new value
   * @param {String} item e.g. skin name and alias
   * @returns {void}
   */
  logDiff(h, s1, s2, item) {
    const embed = `[${h}] of ${chalk.italic(item)}`;
    const differ = diff.diffChars(s1, s2);
    const hasChanged = differ.reduce((changes, part) => {
      if (part.added || part.removed) changes = true;
      return changes;
    }, false);

    if (hasChanged) {
      process.stdout.write(
        chalk.cyan(
          `${embed}, was length=${s1.length}, ${
            s1.length === s2.length ? 'now same' : 'now=' + chalk.white(s2.length)
          }: `
        )
      );
      differ.forEach(part => {
        const color = part.added ? 'green' : part.removed ? 'red' : 'grey';
        process.stdout.write(chalk[color](part.value));
      });
      process.stdout.write('\n');
    } else {
      console.log(chalk.grey(`${embed} is unchanged.`));
    }
    return hasChanged;
  }

  diffSkin(skinName, skin1, skin2) {
    try {
      this.#validateOptions(skin1);
      delete skin1.diff;
      let skinChanged = false,
        fieldChange;
      for (let field of Object.keys(skin1)) {
        fieldChange = this.logDiff(field, skin1[field], skin2[field] || '', skinName);
        skinChanged = skinChanged || fieldChange;
      }
      return skinChanged;
    } catch (err) {
      throw err;
    }
  }

  #validateOptions(options) {
    assert.ok(typeof options === 'object', 'Options must be an object!');
    assert.ok(
      Object.keys(options).filter(key => !['title', 'description', 'skin', 'diff'].includes(key)).length === 0,
      'Invalid option key!'
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

      await this.delayNextPromise();

      if (options.diff) {
        delete options.diff;
        const item = `${skinName} (${alias})`;

        let hasChanged = false;
        for (let option of Object.entries(options)) {
          let [field, newValue] = option;
          if (oldSkin[field] != newValue) {
            this.logDiff(field, oldSkin[field], newValue, item);
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
      console.log(chalk.red(`Error while creating new skin "${alias}/${skinName}" --> ${err}`));
    }
  }

  async deleteSkin(alias, skinName) {
    try {
      this.checkLoggedIn();

      const { isModified, prototype, name } = await this.isModifiedSkin(alias, skinName);
      if (!isModified) throw new Error('Skin is not a modified/deletable skin!');

      await this.getLayoutUrl(alias);

      const deleteUrl = `${this.layoutUrl}/skins/${prototype}/${name}/delete`;
      let response = await this.got.get(deleteUrl);

      await this.delayNextPromise();

      response = await this.got.post(deleteUrl, {
        form: {
          secretKey: this.#getSecretKey(response.body),
          remove: 'Löschen'
        }
      });
      if (!this.silent)
        console.log(`Skin "${alias}/${skinName}" successfully deleted (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`Error while deleting skin "${alias}/${skinName}" --> ${err}`));
    }
  }

  async createSkin(alias, skinName, options = {}) {
    try {
      this.#validateOptions(options);

      const { valid } = await this.isValidHoptype(skinName);
      if (!valid) throw new Error(`New skin does not have a valid Hoptype!`);

      const layoutUrl = await this.getLayoutUrl(alias);

      const data = await this.getSkin({
        name: skinName,
        url: `${layoutUrl}/skins/edit?key=${skinName}&skinset=&action=`
      });

      await this.delayNextPromise();

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
      console.log(chalk.red(`Error while creating skin "${alias}/${skinName}" --> ${err}`));
    }
  }

  async listFiles(alias) {
    const returnFilesOnPage = $$ =>
      $$('.listItem b')
        .map((i, el) => $$(el).text())
        .get();

    try {
      this.checkLoggedIn();

      const filesUrl = `${this.getAliasDomain(alias)}/files/?page=`;

      let response = await this.got.get(`${filesUrl}0`);
      let $ = cheerio.load(response.body);
      let allFiles = returnFilesOnPage($);
      let maxPage = 0;
      const $pageNav = $('.pageNavSummary:first'); // e.g. "zeige 1-20 (von 70)"
      if ($pageNav) {
        const totalFiles = parseInt($pageNav.text().split(' ').pop());
        maxPage = Math.floor(totalFiles / 20);
      }

      for (let page = 1; page <= maxPage; page++) {
        await this.delayNextPromise();
        response = await this.got.get(`${filesUrl}${page}`);
        allFiles = allFiles.concat(returnFilesOnPage(cheerio.load(response.body)));
      }
      return allFiles;
    } catch (err) {
      console.log(chalk.red(`Error while getting the files list of "${alias}" --> ${err}`));
      return [];
    }
  }

  async hasFile(alias, fileName) {
    try {
      this.checkLoggedIn();

      const fileUrl = `${this.getAliasDomain(alias)}/files/${fileName}`;
      await this.got.get(fileUrl);
      return true;
    } catch (err) {
      return false;
    }
  }

  async deleteFile(alias, fileName) {
    try {
      this.checkLoggedIn();

      const deleteUrl = `${this.getAliasDomain(alias)}/files/${fileName}/delete`;
      let response = await this.got.get(deleteUrl);

      await this.delayNextPromise();

      response = await this.got.post(deleteUrl, {
        form: {
          secretKey: this.#getSecretKey(response.body),
          remove: 'Löschen'
        }
      });
      if (!this.silent)
        console.log(`File "${alias}/${fileName}" successfully deleted (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`Error while deleting file "${alias}/${fileName}" --> ${err}`));
    }
  }

  async createFile(alias, file) {
    try {
      this.checkLoggedIn();

      const createUrl = `${this.getAliasDomain(alias)}/files/create`;
      let response = await this.got.get(createUrl);

      await this.delayNextPromise();

      const form = new FormData();
      form.append('secretKey', this.#getSecretKey(response.body));
      form.append('rawfile', fs.createReadStream(file.path));
      form.append('alias', file.name);
      form.append('description', file.description);
      form.append('save', 'Sichern');
      response = await this.got.post(createUrl, {
        body: form
      });
      if (!this.silent)
        console.log(`File "${alias}/${file.name}" successfully created (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`Error while creating file "${alias}/${file.name}" --> ${err}`));
    }
  }

  async updateFile(alias, file) {
    try {
      const fileExists = await this.hasFile(alias, file.name);
      if (fileExists) await this.deleteFile(alias, file.name);
      await this.createFile(alias, file);
    } catch (err) {
      console.log(chalk.red(`Error while updating file "${alias}/${file.name}" --> ${err}`));
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
    assert.ok(typeof story === 'object', 'Story param must be an object!');
    assert.ok(
      Object.keys(story).filter(key => !['title', 'niceurl', 'body', 'id', 'topic', 'publish', 'action'].includes(key))
        .length === 0,
      'Invalid story param key!'
    );
    assert.ok(story.title, 'Story title must not be empty!');
    story.niceurl = this.getNiceUrl(story.niceurl ? story.niceurl : story.title);

    if (story.action) assert.ok(['save', 'publish'].includes(story.action));
    else story.action = 'save';
  }

  async hasStory(alias, id) {
    try {
      const storyUrl = `${this.getAliasDomain(alias)}/stories/${id}`;
      await this.got.get(storyUrl);
      return true;
    } catch (err) {
      return false;
    }
  }

  async createStory(alias, story) {
    try {
      this.#validateStory(story);

      const storyCreateUrl = `${this.getAliasDomain(alias)}/stories/create`;
      let response = await this.got.get(storyCreateUrl);

      await this.delayNextPromise();

      const form = {
        secretKey: this.#getSecretKey(response.body),
        content_title: story.title,
        modNiceUrls_urlid: story.niceurl,
        content_text: story.body || '',
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

      response = await this.got.post(storyCreateUrl, { form });

      if (!this.silent)
        console.log(`Story "${alias}/${story.niceurl}" successfully created (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`Error while creating story "${alias}/${story.niceurl}" --> ${err}`));
    }
  }

  #getStoryParams(data) {
    let $ = cheerio.load(data);
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
    try {
      this.#validateStory(story);

      const storyID = story.id || story.niceurl;
      const storyEditUrl = `${this.getAliasDomain(alias)}/stories/${storyID}/edit`;
      let response = await this.got.get(storyEditUrl);
      const params = this.#getStoryParams(response.body);

      await this.delayNextPromise();

      const form = {
        secretKey: params.secretKey,
        content_title: story.title || params.content_title,
        modNiceUrls_urlid: story.niceurl || params.niceurl,
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

      response = await this.got.post(storyEditUrl, { form });

      if (!this.silent)
        console.log(`Story "${alias}/${storyID}" successfully updated (statusCode=${response.statusCode}).`);
      return response;
    } catch (err) {
      console.log(chalk.red(`Error while updating story "${alias}/${storyID}" --> ${err}`));
    }
  }

  async getStoryTopics(alias) {
    try {
      const storyTopicsUrl = `${this.getAliasDomain(alias)}/topics`;
      const response = await this.got.get(storyTopicsUrl);

      const $ = cheerio.load(response.body);
      return $('.listItem td>a')
        .map((i, el) => {
          let $el = $(el);
          return { name: $el.text(), url: $el.attr('href') };
        })
        .get();
    } catch (err) {
      console.log(chalk.red(`Error while reading story topics of "${alias}" --> ${err}`));
    }
  }

  async downloadLayout(alias, layout) {
    try {
      this.checkLoggedIn();

      const downloadUrl = `${this.getAliasDomain(alias)}/layouts/${layout.name}/download`;
      let response = await this.got.get(downloadUrl);

      await this.delayNextPromise();

      response = await this.got.post(downloadUrl, {
        form: {
          secretKey: this.#getSecretKey(response.body),
          changesonly: 'Nur Änderungen'
        }
      });

      const zip = fs.createWriteStream(layout.path);
      zip.write(response.rawBody);
      zip.end();

      if (!this.silent) console.log(`Layout "${alias}/${layout.name}" successfully downloaded.`);
      return true;
    } catch (err) {
      console.log(chalk.red(`Error while downloading layout "${alias}/${layout.name}" --> ${err}`));
    }
  }

  async checkUserAlienVersion(alias) {
    try {
      let response = await this.got.get(`${this.getAliasDomain(alias)}`);
      let $ = cheerio.load(response.body);
      let el = $('body')[0];
      return el.attribs['data-version'] || 'N/A';
    } catch (err) {
      console.log(chalk.red(`Error while checking alien version of "${alias}" --> ${err}`));
    }
  }
}

module.exports = Twoday;
