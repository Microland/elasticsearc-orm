const request = require('../util/request.js');
const config = require('../util/globalConfig.js');
const Condition = require('./esCondition.js');
module.exports = function(name, opts, mappings, settings) {
    const self = this;
    Condition.call(this);
    const DOMAIN = config.get('domain'),
        PORT = config.get('port'),
        BASE_URL = config.get('BASE_URL'),
        INDEX = opts.index,
        TYPE = opts.type;
    let exists, dbMappings;
    this.sortList = [];
    this.sourceList = undefined;
    const reset = () => {
        this.mustList = [];
        this.shouldList = [];
        this.notList = [];
        this.filterList = [];
        this.sortList = [];
        this.sourceList = [];
        this.count = 0;
        this.offset = undefined;
        this.limit = undefined;
    };

    const checkExists = async() => {
        const url = BASE_URL + INDEX;
        let result, flag = false;
        try {
            result = await request({
                'url': url,
                'method': 'GET'
            });
            let mappings = result[INDEX].mappings;
            flag = mappings.hasOwnProperty(TYPE);
            if (flag) {
                dbMappings = mappings[TYPE].properties;
            }
        } catch (e) {
            return false;
        }
        return flag;
    };

    const createDb = async() => {
        const url = BASE_URL + INDEX;
        const data = {};
        if (settings) {
            data.settings = settings;
        }
        if (mappings) {
            data.mappings = {
                [TYPE]: {
                    'properties': mappings
                }
            };
        }
        let body = await request({
            'url': url,
            'method': 'PUT',
            'body': JSON.stringify(data)
        });
    };


    const updateDb = async() => {
        let incremental = {};
        if (mappings && dbMappings) {
            Object.keys(mappings).filter((key) => {
                console.log('key', key, dbMappings);

                return !dbMappings.hasOwnProperty(key);
            }).forEach((key) => {
                incremental[key] = mappings[key];
            });
        }
        let params = {
            'properties': incremental
        };
        const url = `${BASE_URL}${INDEX}/_mapping/${TYPE}`;
        body = await request({
            url,
            'method': 'PUT',
            'body': JSON.stringify(params)
        });
    };



    this.from = (from) => {
        if (isNaN(from)) {
            throw new Error('from parameter is invalid');
        }
        this.offset = from;
        return this;
    };
    this.size = (size) => {
        if (isNaN(size)) {
            throw new Error('from parameter is invalid');
        }
        this.limit = size;
        return this;
    };

    this.sync = async() => {
        if (exists === undefined) {
            exists = await checkExists();
        }
        if (!exists) {
            await self.createDb();
        } else {
            await updateDb();
        }
        if (!mappings) {
            mappings = dbMappings;
        }
    };

    this.delete = async(id) => {
        if (!id) {
            throw new Error("id is not defined");
        }
        const url = `${BASE_URL}${INDEX}/${TYPE}/${id}`;
        let result = await request({
            url,
            'method': 'DELETE'
        });
    };

    this.sort = (...args) => {
        if (args.length === 1 && typeof args[0] === 'object') {
            this.sortList.push(args[0]);
        } else {
            let [field, type, mode] = args;
            if (typeof field !== 'string' || typeof type !== 'string') {
                throw new Error('arguments type error');
            }
            type = type.toLowerCase();
            if (type !== 'asc' && type !== 'desc') {
                throw new Error('arguments type must be one of `asc` or `desc`');
            }
            let item = {
                [field]: {
                    'order': type
                }
            };
            if (!!mode) {
                item[field].mode = mode;
            }
            this.sortList.push(item);
        }
        return this;
    }

    this.source = (sources) => {
        this.sourceList = sources;

        return this;
    };

    this.create = async(data, id = '') => {
        const url = `${BASE_URL}${INDEX}/${TYPE}/${id}`;
        const reqType = !!id ? 'PUT' : 'POST';
        const body = await request({
            url,
            'method': reqType,
            'body': JSON.stringify(data)
        });
        return body._id
    }

    this.update = async(id, data) => {
        const url = `${BASE_URL}${INDEX}/${TYPE}/${id}`;
        const body = await request({
            url,
            'method': 'PUT',
            'body': JSON.stringify(data)
        });
        return;
    };

    this.get = async(id) => {
        const url = `${BASE_URL}${INDEX}/${TYPE}/${id}`;
        const body = await request({ url, 'method': 'GET' });
        const data = body._source;
        data.id = body._id;
        return {
            data,
            orgData: body
        }
    };

    this.query = async() => {
        let obj = this.valueOf();
        const body = {
            'query': obj
        };
        if (this.offset !== undefined) {
            body.from = this.offset;
        }
        if (this.limit !== undefined) {
            body.size = this.limit;
        }
        if (this.sortList.length > 0) {
            body.sort = this.sortList;
        }
        if (!!this.sourceList) {
            body['_source'] = this.sourceList;
        }
        const url = `${BASE_URL}${INDEX}/${TYPE}/_search`;
        let result = await request({
            url,
            'body': JSON.stringify(body),
            'method': 'POST',
        });
        let list = result.hits.hits.map((item) => {
            item._source.id = item._id;
            return item._source;
        });
        reset();
        return {
            list,
            'orgResult': result
        }
    };

    const init = async() => {
        exists = await checkExists();
    };
    init();
};

module.exports.prototype = Condition.prototype;