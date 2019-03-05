# elasticsearch - orm-a basic Elasticsearch query API

[![npm package](https://nodei.co/npm/elasticsearch-orm.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/elasticsearch-orm/)

## Install
```bash
  npm install elasticsearch-orm-v1
```

## Directory

- [Create connection] (#user-content-create connection)
- [Index related] (#user-content-index related)
- [Documentation related] (#user-content-documentation related)
- [Query related] (#user-content-query related)
- [Using aggregate] (#user-content-using aggregate)
- [Pagination related] (#user-content-pagination related)
- [Settings] (#user-content-Settings)
- [Cluster-related Interface] (#user-content-cluster-related interface)
- [Query API] (#user-content-query api)
- [Aggregate API] (#user-content-aggregate api)

---


## Create a connection

```js
  const orm = require('elasticsearch-orm-v1');
  const instance = orm({
      'domain':'127.0.0.1',
      'port':9200
  });

  instance.on ('connected', () =>{
      console.log ('connected');
  });

  instance.on ('error', (e) =>{
    console.log('connection exception', e);
  });
```

## Index related

### Create an index

Generate an index type

```js
  const demoIndex = instance.register ('demoIndex',{
      'index': 'demoindex',
      'type':'demotype'
    },{
        'title':{
            'type':'text'
        },
        'age':{
            'type': 'integer'
        },
        'location':{
            'type': 'geo_point'
        }
      },{
        'number_of_shards': 2,
        'number_of_replicas': 4
      });
```
Synchronous index: if the index has not been created, it will follow mappings and settings`create 'index, if the index has been created, it will automatically determine which mappings are new, and these new mappings' add`to the index.the sync method returns a Promise object, so you can use the await keyword.


```js
   await demoIndex.sync.();
```

### Index health values
```js
    const health = await demoIndex.health();
```
### Index State
```js
    const stat = await demoIndex.stat.();
```
### Index statistics
```js
    const state = await demoIndex.state();
```
### SET index alias
```js
    const result = await demoIndex.alias (['alias_name']);
```
### Remove alias
```js
    const result = await demoIndex.removeAlias (['alias_name']);
```
### Refresh
```js
    const result = await demoIndex.refresh();
```
### Rinse
```js
    const result = await demoIndex.flush.();
```
### Force merge
```js
    const result = await demoIndex.forceMerge();
```
### Test the word breaker
```js
    const result = await demoIndex.analyze ('I love Beijing Tiananmen', 'ik_max_word');
```
### Open an index
```js
    const result = await demoIndex.open();
```

### Close an index
```js
    const result = await demoIndex.close.();
```

## Documentation related
### Create a document
the create method returns a Promise object that uses the await keyword to return the newly created document ID
```js
let id = await demoIndex.create({
    'title': 'Demo Title',
    'age', 12,
    'location':{
      'lon':100.1,
      'lat':40.2
    }
  });
```

Specify the document ID to create the document
```js
  await demoIndex.create({
    'title': 'Demo Title',
    'age', 12,
    'location':{
      'lon':100.1,
      'lat':40.2
    }
  }, 'document_id');
```
Specifying a document routing
```js
  await demoIndex.create({
    'title': 'Demo Title',
    'age', 12,
    'location':{
      'lon':100.1,
      'lat':40.2
    }
  }, 'document_id', 'routing_hash');
```
Specifying a parent node
```js
  await demoIndex.create({
    'title':'Title',
    'age':123
    }, null, null,{
      'parent': 'parent_id'
    })
```
### Update documentation
```js
  await demoIndex.update ('docuemnt_id',{
    'title': "Demo Title 2",
    'age':13
  })
```
Specifying a document routing
```js
  await demoIndex.update ('document_id',{
    'title': 'Demo Title 2',
    'age':14
    }, 'routing_hash')
```
### Delete document
``` js
  await demoIndex.delete(id);
  await demoIndex.delete (['id1', 'id2'])
```
### Get documents by id
If the id does not exist, an Error is returned
```js
  let doc = await demoIndex.get(id);
```

## Query related
### Build simple queries
```js
    let ret = await demoIndex.query();
```
ret object returns even a child object, one is list, is the result of extracting a good _source array, the other is orgResult, is the original content returned by es
### Query conditions
For a single query, see [query API] (#user-content-query api)
```js
  let ret = await demoIndex.term ('age', 12).query();
```
Multiple query conditions
```js
  let ret = await demoIndex
      .term('age', 12)
      .match ('title',")
      .query();
```
must, should, not inquiry
```js
  const Condition = require("elasticsearch-orm-v1").Condition;
  let ret = await demoIndex
    .must (new Condition().term('age', 12))
    .should(new Condition().match ('title', 'Tiel'))
    .not (new Condition().exists('age'))
    .query();
```
filter query
```js
  const Condition = require("elasticsearch-orm-v1").Condition;
  let ret = await demoIndex
            .filter (new Condition().matchAll())
            .query();
```
### Building nested queries
```js
const Condition = require("elasticsearch-orm-v1").Condition;
let condition = new Condition();
condition.term('age', 12)
    .match ('title','Title')
    .not (new conditional()
    .range('age',0, 10));
let ret = await demoIndex
    .should(condition)
    .exists ('location')
    .query();
```

## Working with aggregations
### Use basic aggregation
You can get the result of the aggregation through the orgresult object's original return value. see the complete aggregation API at [aggregation API] (#user-content-aggregation api)
```js
  const Aggs = require('elasticsearch-orm').Aggs.;
  let ret = await demoIndex
      .exists('age')
      .aggs(new Aggs('avg_age').avg('age'))
      .query();
```
### Aggregated sub-aggregations
```js
  const Aggs = require('elasticsearch-orm').Aggs.;
  let aggs = new Aggs ('test_aggs').terms ('title');
  aggs.aggs(new Aggs('sub_aggs').valueCount('age'));
  let ret = await demoIndex
      .exist('age')
      .aggs(aggs)
      .query();
```
## Pagination related
### Pagination
```js
  let ret = await demoIndex
      .from(0)
      .size (15)
      .query();
```
### Use the scroll
Initiate a scroll
```js
    await demoIndex.query({
        'scroll':'1m'
    })
```
Perform scrolling
```js
    await demoIndex.scroll(scrollId,{
        'scroll':'1m'
    });
```
Clear a scroll
```js
    await demoIndex.clearScroll(scrollId);
```
### Sort
```js
  let ret = await demoIndex
      .sort ('age','asc')
      .sort ('title','asc', 'min')
      .query();
```
Or ...
```js
  let ret = await demoIndex
      .sort.({
          'age':{
              'order': 'desc',
              'mode': 'min'
          }
      })
      .query();
```
## Settings
If debug is set to true, the request body, url, and return value of each request are printed
```js
  let instance = orm({
    'domain':'127.0.0.1',
    'port':9200
  });
  instance.set ("debug", true);
```
You can set the method of debug
```js
  instance.set ("log", console.log);
```
Set request timeout in milliseconds (default is 30s）
```js
  instance.set ('timeout', 5000);
```
## Cluster-related interfaces
### Get cluster health values
```js
    const health = await instance.health();
```
### Get cluster status
```js
    const state = await instance.state();
```
### Get cluster statistics
```js
    const stat = await instance.stat.();
```
### Get Index list
```js
    const result = await instance.indices();
```
### Node information
```js
    const result = await instance.nodes();
```
### Node status
```js
    const result = await instance.nodeStat ('node_id');
```
### Close a node
```js
    const result = await instance.shutDown ('node_id');
```

## Query API
### Text matching
#### match query
```js
  let condition = new Condition();
  condition.match ('title', 'content1 content2');
  condition.match ('title', 'content1 content2',{
    'operator':'and'
    });
```
The generated query json is
```json
  {
    "match":{
        "title": "content1 content2",
        "operator": "and"
    }
  }
```
the field argument can be an array
```js
  condition.match (['title', 'description'], 'content1 content2');
  condition.match (['title', 'description'], 'content1 content2',{
      'type': 'best_fields'
    });
```
The generated query json is
```json
  {
    "multi_match":{
        "query": "content1 content2",
        "type": "best_fields",
        "fields": ["title","description"]
    }
  }
```
#### Phrase query matchPhrase and matchPhrasePrefix
```js
condition.matchPhrase('title', 'content1 content2');
condition.matchPrasePrefix ('title', 'content1 content2');
condition.matchPhrase('title', 'content1 content2',{
  'analyzer': 'test_analyzer'
  });
```
Generate query json
```json
  {
    "match_phrase":{
      "title":{
        "query": "content1 content2",
        "analyzer": "test_analyzer"
      }
    }
  }
  {
    "match_phrase_prefix":{
      "title":{
        "query": "content1 content2"
      }
    }
  }
```
### Exact value
#### term query
```js
condition.term('age', 13);
condition.term('age',[13,15]);
```
Generate query json
```json
  {
    "term.":{
        "age": 13
    }
  }
  {
    "terms.":{
        "age":[13,15]
    }
  }
```
#### exists query
```js
condition.exists('age');
condition.exists (['age','title']);
```
Generating json
```json
{
  "exists.":{
    "field": "age"
  }
}
{
  "exists.":{
    "fields":["age", " title"]
  }
}
```
#### range query
```js
condition.range('age', 1);
condition.range('age',1, 10);
condition.range('age', null, 10);
condition.range('age', 1, 10, true, false);
```
Generating json
```json
  {
    "range.":{
        "age":{
            "gt":1
        }
    }
  }
  {
    "range.":{
        "age":{
            "gt":1,
            "lt": 10
        }
    }
  }
  {
    "range.":{
        "age":{
            "lt": 10
        }
    }
  }
  {
    "range.":{
        "age":{
            "gte": 1,
            "lt": 10
        }
    }
  }
```
Using the Range object
```js
const Range = require ('elasticsearch-orm').Range.();
let range = new Range(1);
range = new Range(1,10);
range = new Range(1,10, false, true);
range = new Range(). gt(1,true). lt (10, false);
condition.range(range);
```
#### prefix, wildcard and fuzzy
```js
condition.prefix ('title', 'Tre');
condition.wildcard ('title', 'Tre * hao');
condition.fuzzy ('title',{
  'value': 'ki',
  'boost':1.0
})
```
Generating json files
```json
{
  "prefix":{
    "title": "Tre"
  }
}
{
  "wildcard.":{
    "title": "Tre * hao"
  }
}
{
  "fuzzy.":{
    "title":{
        "value": "ki",
        "boost":1.0
    }
  }
}
```
### Geographic location query
#### geoShape
```js
condition.geoShape ('location','circle',
  [{
  'lon': 100.0,
  'lat': 41.0
  }],
  {
    'radius': "100m",
    "relation": "within"
    })
```
Generating json
```json
  {
    "geo_shape":{
        "location":{
            "shape.":{
              "type": "circle",
              "coordinates.":[{
                "lon":100.0,
                "lat":41.0
              }],
              "relation": "within"
            }
        }
    }
  }
```
#### geoDistance
```js
  condition.geoDistance ('location',{
    'lon': 100.0,
    'lat':31.0
    }, '100m');
```
Generating json
```json
  {
    "geo_distance":{
      "distance": "100m",
      "location":{
        "lon":100.0,
        "lat":31.0
      }
    }
  }
```
#### geoPolygon
```js
condition.geoPolygon ('location',[{
  'lon': 100.0,
  'lat':41.1
  },{
    'lon':101.0,
    'lat':42.1
   },{
     'lot':102.3,
     'lat':42.4
    }])
```
Generating json
```json
{
  "geo_polygon.":{
      "location":{
          "points":[{
                  "lon":100.0,
