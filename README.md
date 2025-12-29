# dataORM

## Introduction

>dataORM is a lightweight object relational mapping (ORM) library used to simplify operations on local databases, offering efficient database access performance and low memory consumption. dataORM supports multi-threading, chain calling, backup, upgrade, and caching. Designed for speed and simplicity, it helps you quickly build high-performance applications.

## How to Install

```
ohpm install @ohos/dataorm
```

OpenHarmony ohpm
For details about the environment configuration, see [OpenHarmony HAR](https://gitee.com/openharmony-tpc/docs/blob/master/OpenHarmony_har_usage.en.md).

## How to Use

1. Create an entity class, for example, **Note**.

```
import { Id } from '@ohos/dataorm';
import { NotNull } from '@ohos/dataorm';
import { Entity, Columns } from '@ohos/dataorm';
import { Unique } from '@ohos/dataorm';
import { Index } from '@ohos/dataorm';
import { ToMany } from '@ohos/dataorm';
import { ColumnType } from '@ohos/dataorm';
import { ToOne } from '@ohos/dataorm';

@Entity('NOTE')
export class Note {
    @Id()
    @Columns({ columnName: 'ID', types: ColumnType.num })
    id: number;
    @NotNull()
    @Unique()
    @Index(true)
    @Columns({ columnName: 'TEXT', types: ColumnType.str })
    text: string;
    @Columns({ columnName: 'COMMENT', types: ColumnType.str })
    comment: string;
    @Columns({ columnName: 'DATE', types: ColumnType.str })
    date: Date;
    @Columns({ columnName: 'TYPE', types: ColumnType.str })
    type: string;
    @Columns({ columnName: 'MONEYS', types: ColumnType.real })
    moneys: number;

    // To-do: All non-static variables in the class must be declared in the constructor for reflection to generate columns.
    constructor(id?: number, text?: string, comment?: string, date?: Date, types?: string, moneys?: number) {
        this.id = id;
        this.text = text;
        this.comment = comment;
        this.date = date;
        this.type = types;
        this.moneys = moneys;
    }

    getMoneys(): number {
        return this.moneys;
    }

    setMoneys(moneys: number) {
        this.moneys = moneys;
    }

    getId(): number {
        return this.id;
    }

    setId(id: number) {
        this.id = id;
    }

    getText(): string {
        return this.text;
    }

    /** Not-null value; ensure this value is available before it is saved to the database. */
    setText(text: string) {
        this.text = text;
    }

    getComment(): string {
        return this.comment;
    }

    setComment(comment: string) {
        this.comment = comment;
    }

    getDate(): Date {
        return this.date;
    }

    setDate(date: Date) {
        this.date = date;
    }

    getType(): string {
        return this.type;
    }

    setType(types: string) {
        this.type = types;
    }
}
```

#### Provide annotations for exposure of the following: Column, Entity, Id, NotNull, Unique, Index, ToMany, ToOne, JoinEntity, OrderBy, Convert, Embedded, Transient, Union.

Examples and explanations of how to use annotations:

#### (1) Using Id

1. Import

```
import {Id} from '@ohos/dataorm'; 
```

2. Use

A.

```
@Id()
id: number;
```

B.

```
@Id({ isPrimaryKey: true ,autoincrement:false})
id: number;
```

Note: It is used in class properties to define the primary key of the table and whether the key value is auto-incrementing. The definitions of A and B are equivalent: **isPrimaryKey** is set to **true** (indicating it is a table primary key), and **autoincrement** is set to **false** (indicating that the key value does not auto-increment).

#### (2) Using Entity

1. Import

```
import {Entity} from '@ohos/dataorm';
```

2. Use

```
@Entity('NOTE')
export  class Note {}
```

Note: It is used in class header files to define the table name. In this example, the table name is **NOTE**.

#### (3) Using Column

1. Import

```
import {Columns} from '@ohos/dataorm';
```

2. Use

```
@Columns({ columnName: 'ID', types: ColumnType.num })
text: string;
```

Note: It is used in class properties to define the column name and data type in the table. The first parameter is the column name, and the second parameter is the column data type.

#### (4) Using NotNull

1. Import

```
import {NotNull} from '@ohos/dataorm';
```

2. Use

A.

```
@NotNull()
text: string;
```

B.

```
@NotNull(true)
text: string;
```

Note: It is used in class properties to define whether the table column can be null. If the value is **true**, the column must not be null. The definitions of A and B are equivalent: The column value must not be null.

#### (5) Using Unique

1. Import

```
import {Unique} from '@ohos/dataorm';
```

2. Use

A.

```
@Unique()
text: string;
```

B.

```
@Unique(true)
text: string;
```

Note: It is used in class properties to define whether the column value is unique in the table. If the value is **true**, the column value must be unique. The definitions of A and B are equivalent: The column value is unique.

#### (6) Using Index

1. Import

```
import {Index} from '@ohos/dataorm';
```

2. Use

A.

```
@Index()
text: string;
```

B.

```
@Index(true)
text: string;
```

C.

```
@Index(false)
text: string;
```

Note: It is used in class properties to define the column for creating an index table and whether the index is unique. If the value is **true**, the index is unique. A is defined as a non-unique index, B is defined as a unique index, and C is defined as a non-unique index. The definitions of A and C are the same.

#### (7) Using ToMany

1. Import

```
import {  ToMany } from '@ohos/dataorm';
```

2. Use

```
@ToMany({ targetClsName: "Student", joinProperty: [{ name: "ID", referencedName: "TID" }] })
@OrderBy("NAME ASC")
students: Array<Student>
```

Note: It is used in class properties to define the target relationship table **targetClsName**, the column **name** to be queried, and **referencedName** associated with the external target table.
The value of **name** is the value of the target **referencedName**.
The object array of the target table is returned.

Call method:

```
  async queryByToManyFunctionTest() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.studentDao = this.daoSession.getBaseDao(Student);
    var teacherId: string[] = ["1"]
    let data = await this.studentDao.queryToManyListByColumnName("students", teacherId)
    data.forEach(element => {
      console.info("-----tonMany-----" + JSON.stringify(element))
    });
  }
```

Note: The Data Access Object (DAO) of the target table is obtained by calling **queryToManyListByColumnName(toManyColumnName: string, arr: string[])**.
The input parameter **toManyColumnName** is the variable name under @ToMany of the class created by the current table, and the input parameter **arr** is the query value of the associated column.

#### (8) Using JoinEntity

1. Import

```
import { JoinEntity } from '@ohos/dataorm';
```

2. Use

```
@JoinEntity({ entityName: 'JoinManyToDateEntity', targetClsName: 'DateEntity',  sourceProperty: 'ID_TO_MANY', targetProperty: 'ID_DATE' })
@OrderBy("ID DESC")
dateEntityList: Array<DateEntity>
```

Note: It is used in class properties to define the relationship between join tables. **entityName** indicates the entity class name of the join table, **targetClsName** indicates the entity class name of the target table,
**sourceProperty** is the property name that contains the source (current) entity ID in the join entity,
and **targetProperty** is the property name that contains the target entity ID in the join entity. The object array of the target table is returned.

Call method:

```
  async queryByJoinEntityFunctionTest(){
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.studentDao = this.daoSession.getBaseDao(DateEntity);
    var teacherId: string[] = ["11"]
    let data = await this.studentDao.queryToManyListByColumnName("dateEntityList", teacherId)
    data.forEach(element => {
      console.info("-----JoinEntity-----" + JSON.stringify(element))
    });
  }
```

Note: The DAO of the target table is obtained by calling **queryToManyListByColumnName(toManyColumnName: string, arr: string[])**.
The input parameter **toManyColumnName** is the variable name under @ToMany of the class created by the current table, and the input parameter **arr** is the query value of the associated column.

#### (9) Using ToOne

1. Import

```
import { ToOne } from '@ohos/dataorm';
```

2. Use

```
@ToOne({ value: 'TID', targetObj: Teacher })
teacher: Teacher
```

Note: It is used in class properties to define the **value** of the current table as the column and **targetObj** as the class.

Call method:

A.

```
async loadDeep() {
   this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
   this.studentDao = this.daoSession.getBaseDao(Student);
   let studentId =         1
   let student: Student = await this.studentDao.loadDeep(studentId);
}
```

B.

```
async queryByToOneFunctionTest() {
     this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
     this.studentDao = this.daoSession.getBaseDao(Student);
     let columnName = this.studentDao.getPkProperty().columnName
     let entityList = await this.studentDao.queryDeep("WHERE T." + columnName + "=?", ["1"]);
     let entity3: Student = entityList[0];
}
```

Note: Obtain the DAO of the target table and construct the SQL query string as a parameter for **queryDeep(where: string, selectionArg: string[])**.

#### (10) Using Convert

1. Import

```
import { Convert } from '@ohos/dataorm';
```

2. Use

```
@Convert({ converter: TypeConvert, columnType: ColumnType.str })
images: ArrayList<string>;
```

Note: It is used in class properties to store and obtain the corresponding property set or array in the database. In @Convert, the **converter** inherits the **PropertyConverter** entity and implements its abstract method, and **columnType** corresponds to the type stored in the database.

PropertyConverter description:
| API                                      | Description                                          |
| -------------------------------------------- | -------------------------------------------------- |
| convertToEntityProperty(databaseValue: Q): P | Converts database data into a set or array.              |
| convertToDatabaseValue(entityProperty: P): Q | Converts the set or array data in an object entity into a type suitable for database storage.|

#### (11) Using Transient

1. Import

```
import { Transient } from '@ohos/dataorm';
```

2. Use

```
@Transient()
home: string
```
Note: Properties annotated with Transient are not mapped to the database.

#### (12) Using Embedded

1. Import

```
import { Embedded } from '@ohos/dataorm';
```

2. Use

```
@Embedded({ prefix: "f_", targetClass: Father })
father: Father
```
Note: It supports data entity nesting and parameter description. **prefix** indicates the prefix added to the column name in the database and **targetClass** indicates the nested entity.

#### (13) Using Union

1. Import

```
import { Union } from '@ohos/dataorm';
```

2. Use

```
@NotNull()
@Union()
@Columns({ columnName: "FIRST_NAME", types: ColumnType.str })
firstName: string;
```

Note: The key annotated with Union becomes one of the composite primary keys of the table.


#### 1. Initializing Non-Encrypted Library in AbilityStage.ts

 ```

 let helper: ExampleOpeHelper = new ExampleOpenHelper(this.context, "notes.db");
 helper.setEntities(Note);
 let db: Database = await helper.getWritableDb();
 this.data.daoSession = new DaoMaster(db).newSession();
 ```

#### 2. Initializing Encrypted Library in AbilityStage.ets

 ```
 let helper: ExampleOpenHelper = new ExampleOpenHelper(context, "notes.db");
 // Set the data encryption key, which cannot be changed after encryption. The encrypted and non-encrypted libraries cannot be switched. (A common database cannot be set as an encrypted library, and an encrypted library cannot be changed to a common library.)
 helper.setEncrypt(true);
 // Add all tables (new, modified, existing) to the global table.
 helper.setEntities(Note);
 let db: Database = await helper.getWritableDb();
 this.data.daoSession = new DaoMaster(db).newSession();
 ```

#### 3. Obtaining daoSession and DAO from Index Page in Demo

 ```
private aboutToAppear() {
    daoSess =  GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.daoSession = daoSess;
    noteDaos = this.daoSession.getBaseDao(Note);
}
 ```

#### 4. Adding and Removing a Listener

 ```
 /*
   * Listener
   */
 private tabListener(): OnTableChangedListener<any>{
    return {
      async onTableChanged(t: any, err, action: TableAction) {
        if (action == TableAction.INSERT) {          
          await this.updateNotes();
        } else if(action == TableAction.UPDATE){
          await this.updateNotes();
        } else if(action == TableAction.DELETE){
          await this.updateNotes();
        } else if (action == TableAction.QUERY) {
        }
      }
    }
  }
  /*
   * Add a listener.
   */
  noteDaos.addTableChangedListener(this.tabListener());
  
  /**
   * Remove the listener.
   */
  noteDaos.removeTableChangedListener();
      
 ```

#### 5. Operating Database

```
// Add
let date = new Date();
let comment = "Added on " + date.toLocaleString();

let note = new Note();
note.setText(this.noteText);
note.setComment(comment);
note.setDate(new Date());
note.setType(NoteType[NoteType.TEXT]);
noteDaos.insert(note);


// Query
let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
let properties = entityClass.Note as Record<string, Property>;
let notesQuery = this.noteDao.queryBuilder().orderAsc(properties.text).build();
this.arr = await this.notesQuery.list();

Or

let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
let properties = entityClass.Note as Record<string, Property>;
let query = this.noteDao.queryBuilder().orderAsc(properties.text).buildCursor();
let a = await query.list();


// Delete
let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
let properties = entityClass.Note as Record<string, Property>;
let deleteQuery = this.noteDao.queryBuilder().where(properties.text.eq("bbb"))
  .buildDelete();
deleteQuery.executeDeleteWithoutDetachingEntities();
```

#### 6. Entity Inheritance

You can use the entity inheritance patterns to reduce code redundancy, enable code reuse, and improve program maintainability.

1. Define a base class, place common properties in the base class, and mark them with **@Columns**.

```
import { Columns, ColumnType } from '@ohos/dataorm';

export  class TableBasic {

  @Columns({ columnName: "CREATETIME", types: ColumnType.str })
  createTime: string;

  getCreateTime(): string {
    return this.createTime;
  }
  setCreateTime (createTime: string) {
    this.createTime = createTime;
  }

  constructor(createTime?: string) {
    this.createTime = createTime;
  }
}
```

2. Inherit the base class in the required service entity.

```
/**
 * Entity mapped to table "NOTE".
 */
import { Columns, ColumnType, Entity, Id, NotNull } from '@ohos/dataorm'
import { TableBasic } from './test/TableBasic'

@Entity("NOTE", [{ value: "text, date DESC", unique: true }])
export class Note extends TableBasic {
  @Id()
  @Columns({ columnName: "ID", types: ColumnType.num })
  id: number
  @NotNull()
  @Columns({ columnName: "TEXT", types: ColumnType.str })
  text: string
  @Columns({ columnName: "COMMENT", types: ColumnType.str })
  comment: string
  @Columns({ columnName: "DATE", types: ColumnType.str })
  date: string
  @Columns({ columnName: "TYPE", types: ColumnType.str })
  type: string
  @Columns({ columnName: "MONEYS", types: ColumnType.real })
  moneys: number

  constructor(
    id?: number,
    text?: string,
    comment?: string,
    date?: string,
    types?: string,
    moneys?: number,
    createTime?: string,
  ) {
    super(createTime)
    this.id = id
    this.text = text
    this.comment = comment
    this.date = date
    this.type = types
    this.moneys = moneys
  }

}

```

The obtained **NOTE** instance can inherit the **CreateTime** property.

#### 7. Multiple Databases
You can create multiple databases. The database names must be unique.

1. Regular SQLite database.

``` 
    let helper: ExampleOpenHelper =  new ExampleOpenHelper(this.context, "notes2.db", "customDir");
    let helper2: ExampleOpenHelper = new ExampleOpenHelper2(this.context, "notes3.db");
```
2. Add all tables (new, modified, existing) to the global table.

``` 

  helper.setEntities(Note, Teacher, JoinManyToDateEntity, DateEntity, Book, Student ,
  Chapter, Topics, User, ConvertInfo, CreateInDBInfo, JoinPropertyUser, Customer, OnePlus);
  helper2.setEntities (Note, Teacher, JoinManyToDateEntity, DateEntity, Book, Student ,
  Chapter, Topics, User, ConvertInfo, CreateInDBInfo, JoinPropertyUser, Customer, OnePlus);
```

3. Add a name to the database or customize a path.

``` 
 let db: Database = await helper.getWritableDb();
 let db2: Database = await helper2.getWritableDb();
 db.name = "notes2.db";
 db.customDir = "customDir";
 db2.name = "notes3.db";
```

4. Create and read database keys and set the corresponding DAO.

``` 
 GlobalContext.getContext().setValue("daoSession2", new DaoMaster(db).newSession());
 GlobalContext.getContext().setValue("daoSession3", new DaoMaster(db2).newSession());
```

5. Read the database and create a table for the specified database.

``` 
 his.daoSession1 = GlobalContext.getContext().getValue("daoSession2") as DaoSession;
 his.noteDao1 = this.daoSession1.getBaseDao(ConvertInfo);
```

## Configuration
1. Log configuration
```ts
let helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "notes.db");
helper.setLogger(true)
```

2. Trace configuration
```ts
import { DaoTraceSpace } from '@ohos/dataorm'

let helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "notes.db");
helper.setTrace({
    enabled: true, // enable trace
    minLevel: DaoTraceSpace.TraceLevel.INFO,  // The trace level of the record. The lower the level, the more frequent the record.
    types: new Set([DaoTraceSpace.TraceType.CRUD]) // The type of trace will be recorded
});
```
3. Auto Migrate
> When the Version number of the Version is greater than the previous version and there is a change in the table field, the database upgrade logic will be automatically executed. When the table structure is upgraded without change, it will be ignored. You can cancel the automatic upgrade (default off) by calling the setAutoMigrate(false) method.

```ts
let helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "notes.db");
await helper.setVersion(newVersion)
await helper.setAutoMigrate(true)
```

## Available APIs

API Preparation

``` 
   // Regular SQLite database
   // The third parameter customDir indicates the custom database path. If this parameter is left blank, the RdbStore instance is created in the sandbox directory of the application by default.
   let helper: ExampleOpenHelper = new ExampleOpenHelper(this.context, "notes.db", "customDir");
   // Set the data encryption key, which cannot be changed after encryption. The encrypted and non-encrypted libraries cannot be switched. (A common database cannot be set as an encrypted library, and an encrypted library cannot be changed to a common library.)
   helper.setEncrypt(true);
   // Add all tables (new, modified, existing) to the global table.
   helper.setEntities(Note, Student, Teacher, JoinManyToDateEntity, DateEntity);
   let db: Database = await helper.getWritableDb();
```

1. Adds
   `noteDao.insert(note)/noteDao.insertSync(note)`
2. Modifies
   `noteDao.update(note)/noteDao.updateSync(note)`
3. Deletes
   `noteDao.delete(note)/noteDao.deleteAsync(notte)/noteDao.deleteSync(note)`
4. Deletes the primary key.
   `noteDao.deleteByKey(id)/noteDao.deleteByKeyAsync(id)/noteDao.deleteByKeySync(id)`
5. Deletes the condition.
   `noteDao.queryBuilder().where(properties['text'].eq("bbb")).buildDelete()`
6. Performs a query.
   `noteDao.queryBuilder().list()/noteDao.queryBuilder().listSync()`
7. Queries the condition.
   `noteDao.queryBuilder.whereOr(properties['text'].eq("aaa"), properties['text'].eq("bbb"), properties['text'].eq("ccc")).list()`
8. Queries the cache.
   `noteDao.load(id)/noteDao.loadSync(id)`
9. Updates data. Resets all locally changed attributes of an entity by reloading values from the database.
   `noteDao.refresh(note)/noteDao.refreshSync(note)`
10. Queries the chain.
    `new inquiry().from(Note).query(Note).then((data) => { if(data)this.arr = data; })`
11. Queries the chain condition.
    `inquiry().from(Note).eq("ID", 2).querySingle(Note).then((data) => {if(data) this.arr = data; })`
12. Adds a listener.
    `noteDao.addTableChangedListener()`
13. Removes the listener.
    `noteDao.removeTableChangedListener()`
14. Saves (adds or updates)
    `noteDao.save(note)/noteDao.saveAsync(note)/noteDao.saveSync(note)`
15. Backs up the database.
    `Migration.backupDB(dbName, tableName, version, context)`
16. Upgrades the database.
    `migration.execute(context)`
17. Imports data from resource files to the database.
    `executeSqlScript(resourceMgr: any, db: Database, rawFilename: string)`
18. Executes raw SQL queries.
    `rawQueries(sql: string, selectionArgs: Array<any>)/rawQueriesSync(sql: string, selectionArgs: Array<any>)`
19. Performs a many-to-many query.
    `queryToManyListByColumnName(toManyColumnName: string, arr: string[])/queryToManyListByColumnNameSync(toManyColumnName: string, arr: string[])`
20. Queries JoinEntity.
    `queryToManyListByColumnName(toManyColumnName: string, arr: string[])/queryToManyListByColumnNameSync(toManyColumnName: string, arr: string[])`
21. Performs a deep query.
    `queryDeep(where: string, selectionArg: string[])/queryDeepSync(where: string, selectionArg: string[])`

For details about unit test cases, see [TEST.md](https://gitcode.com/openharmony-sig/ohos_dataorm/blob/master/TEST.md).

## About obfuscation
- Code obfuscation, please see[Code Obfuscation](https://docs.openharmony.cn/pages/v5.0/zh-cn/application-dev/arkts-utils/source-obfuscation.md).
- If you want the zxing library not to be obfuscated during code obfuscation, you need to add corresponding exclusion rules in the obfuscation rule configuration file obfuscation-rules.txt：
```
-keep
./oh_modules/@ohos/datorm
```

## Constraints

- DevEco Studio: 4.1 Release (4.1.3.317), SDK: API 11 (4.1.0.36).

- DevEco Studio: 4.0 Release (4.0.3.513), SDK: API 10 (4.0.10.10).

- DevEco Studio: 4.0 Release (4.0.3.418), OpenHarmony SDK: (4.0.10.6).

## Directory Structure

```
|---- dataORM  
|     |---- entry  # Sample code
|     |---- library  # dataORM library
|               |----annotation # Annotations
|               |----common # Common class package
|               |----converter # convert annotations
|               |----database # Database
|               |----dbflow # Chain query
|                   |----base # Chain encapsulation
|                   |----listener # Listener callback
|               |----identityscope # Cache
|               |----internal # Internal call file
|               |----query # Query
|           |---- index.ts  # External APIs
|     |---- README.MD  # Readme
```

## How to Contribute

If you find any problem when using the project, submit an [issue](https://gitcode.com/openharmony-sig/ohos_dataorm/issues) or
a [PR](https://gitcode.com/openharmony-sig/ohos_dataorm/pulls).

## License

This project is licensed under [Apache License 2.0](https://gitcode.com/openharmony-sig/ohos_dataorm/blob/master/LICENSE).

## Known Issues

1. The update and creation of the **save(entity: T)** and **insertOrReplace(entity: T)** APIs in the **AbstractDao** class are not supported in API version 9.
