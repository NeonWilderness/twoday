/**
 * Main
 */
const assert = require('assert').strict;
const chalk = require('chalk');
const cheerio = require('cheerio');
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

  #validateOptions(options) {
    assert.ok(typeof options === 'object', 'Options must be an object!');
    assert.ok(
      Object.keys(options).filter(key => !['title', 'description', 'skin'].includes(key)).length === 0,
      'Invalid option key!'
    );
  }

  async updateSkin(alias, skinName, options) {
    try {
      this.#validateOptions(options);

      const { isModified, url } = await this.isModifiedSkin(alias, skinName);
      if (!isModified) return createSkin(alias, skinName, options);

      const data = await this.getSkin({
        name: skinName,
        url
      });

      await this.delayNextPromise();

      let response = await this.postSkin(Object.assign(data, options));
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

      await this.getLayoutUrl(alias);

      const data = await this.getSkin({
        name: skinName,
        url: `${this.layoutUrl}/skins/edit?key=${skinName}&skinset=&action=`
      });

      await this.delayNextPromise();

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
}

module.exports = Twoday;
