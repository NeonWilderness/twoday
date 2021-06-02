/**
 * Main
 */
const assert = require('assert').strict;
const chalk = require('chalk');
const cheerio = require('cheerio');
const got = require('got');
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
    this.layoutUrl = '';
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
    return `https://${alias}.${this.fullDomain}`;
  }

  #getSecretKey(data) {
    let $ = cheerio.load(data);
    return $('[name="secretKey"]').val();
  }

  fixURL(url) {
    // Fix url with missing protocol b/c otherwise it will throw an error
    return url.startsWith('//') ? `https:${url}` : url;
  }

  async login() {
    const loginUrl = `${this.baseUrl}/members/login`;
    try {
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

  async getModifiedSkins(alias) {
    try {
      this.checkLoggedIn();
      const response = await this.got.get('layout/skins/modified', {
        prefixUrl: `${this.getAliasDomain(alias)}`
      });
      const $ = cheerio.load(response.body);
      return $('.skin>a')
        .map(function (i, el) {
          const $el = $(el);
          return { name: $el.attr('name'), url: $el.attr('href') };
        })
        .get();
    } catch (err) {
      console.log(chalk.red(`getModifiedSkins from "${alias}" failed --> ${err}`));
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
      return result;
    } catch (err) {
      console.log(chalk.red(`isModifiedSkin "${alias}/${skinName}" failed --> ${err}`));
    }
  }

  async getLayoutUrl(alias) {
    if (this.layoutUrl) return this.layoutUrl;
    this.checkLoggedIn();
    try {
      const response = await this.got.get('layouts/main', {
        prefixUrl: `${this.getAliasDomain(alias)}`
      });
      const $ = cheerio.load(response.body);
      const url = $('.level2 a.active').eq(0).attr('href');
      this.layoutUrl = this.fixURL(url.split('/').slice(0, -1).join('/'));
      return this.layoutUrl;
    } catch (err) {
      console.log(chalk.red(`getLayoutUrl from "${alias}" failed --> ${err}`));
    }
  }

  async getSkin(skin) {
    try {
      this.checkLoggedIn();
      const response = await this.got.get(this.fixURL(skin.url));
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

  async createSkin(alias, skinName) {
    try {
      // check hoptype validity against github code
      const { valid } = await this.isValidHoptype(skinName);
      if (!valid) {
        console.log(chalk.red(`Error: Sorry, new skin name "${skinName}" does not have a valid Hoptype !!`));
        process.exit(1);
      }

      await this.getLayoutUrl(alias);

      // get edit skin form to acquire relevant post params
      const skin = await this.getSkin({
        name: skinName,
        url: `${this.layoutUrl}/skins/edit?key=${skinName}&skinset=&action=`
      });

      // post the new skin with filler content
      const newSkin = '(new skin)';
      await this.delayNextPromise();
      return await this.postSkin(
        Object.assign(skin, {
          title: `${skinName} ${newSkin}`,
          description: `${newSkin}`,
          skin: `<p><!-- ${newSkin} filler text -->Bacon ipsum dolor amet minim anim duis cillum, esse aliquip non chislic leberkas rump drumstick ut. Burgdoggen hamburger bresaola turkey, chicken commodo chislic anim.</p>\n`
        })
      );
    } catch (e) {
      console.log(chalk.red(`An error occured while creating the new skin "${skinName}": ${e}`));
    }
  }
}

module.exports = Twoday;
