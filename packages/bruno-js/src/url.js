class QueryParam {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

class QueryParamList {
  constructor(req) {
    this.req = req;
    this._params = this._parseUrlQuery();
  }

  _parseUrlQuery() {
    const url = this.req?.url || '';
    const idx = url.indexOf('?');
    if (idx === -1) {
      return [];
    }

    const qs = url.slice(idx + 1);
    return qs
      .split('&')
      .filter((part) => part.length > 0)
      .map((part) => {
        const [key, ...rest] = part.split('=');
        const rawValue = rest.length ? rest.join('=') : '';
        const safeDecode = (str) => {
          try {
            return decodeURIComponent(str);
          } catch (e) {
            return str;
          }
        };
        return new QueryParam(safeDecode(key), safeDecode(rawValue));
      });
  }

  _syncUrl() {
    const url = this.req?.url || '';
    const idx = url.indexOf('?');
    const base = idx === -1 ? url : url.slice(0, idx);
    const qs = this._params
      .map((p) => {
        const safeEncode = (str) => {
          try {
            return encodeURIComponent(str);
          } catch (e) {
            return str;
          }
        };
        return `${safeEncode(p.key)}=${safeEncode(p.value)}`;
      })
      .join('&');
    this.req.url = qs ? `${base}?${qs}` : base;
  }

  add(param) {
    if (!param || typeof param.key !== 'string' || param.key === '') {
      return;
    }
    this._params.push(new QueryParam(param.key, param.value ?? ''));
    this._syncUrl();
  }

  update(param) {
    if (!param || typeof param.key !== 'string' || param.key === '') {
      return;
    }
    const existing = this._params.find((p) => p.key === param.key);
    if (existing) {
      existing.value = param.value ?? '';
    } else {
      this._params.push(new QueryParam(param.key, param.value ?? ''));
    }
    this._syncUrl();
  }

  remove(key) {
    if (typeof key !== 'string' || key === '') {
      return;
    }
    this._params = this._params.filter((p) => p.key !== key);
    this._syncUrl();
  }

  get(key) {
    return this._params.find((p) => p.key === key);
  }

  clear() {
    this._params = [];
    this._syncUrl();
  }

  count() {
    return this._params.length;
  }

  each(callback) {
    this._params.forEach((p, index) => callback(p, index));
  }

  toObject() {
    return this._params.reduce((acc, p) => {
      acc[p.key] = p.value;
      return acc;
    }, {});
  }

  toString() {
    const qs = this._params
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }

  all() {
    return this._params.map((p) => ({ key: p.key, value: p.value }));
  }
}

class Url {
  constructor(req) {
    this.req = req;
    this.query = new QueryParamList(req);
  }

  toString() {
    return this.req?.url || '';
  }

  valueOf() {
    return this.req?.url || '';
  }
}

module.exports = {
  Url,
  QueryParamList,
  QueryParam
};
