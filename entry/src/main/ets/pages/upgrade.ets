/*
  * Copyright (c) 2022 Huawei Device Co., Ltd.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
    *
  * http://www.apache.org/licenses/LICENSE-2.0
    *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

import dataRdb from '@ohos.data.relationalStore'
import { Migration, GlobalContext, DaoSession } from '@ohos/dataorm'
import { Database } from '@ohos/dataorm'
import { DbUtils } from '@ohos/dataorm'
import { ValuesBucket } from '@ohos.data.ValuesBucket'
import { Student } from '../pages/test/Student'
import { Toolbar } from './toolbar'
import promptAction from '@ohos.promptAction'

let ctt: Context;

@Entry
@Component
struct upgrade {
  @State arr: Array<Student> = new Array<Student>();
  private dbName: string = "testRgb.db";
  private tableName: string = "STUDENT";
  private version: number = 1
  @State importResult: string = "";

  getResourceString(res:Resource){
    return getContext().resourceManager.getStringSync(res.id)
  }

  createRgb() {
    const SQL_CREATE_TABLE = "CREATE TABLE IF NOT EXISTS STUDENT (ID INTEGER PRIMARY KEY AUTOINCREMENT, NAME TEXT NOT NULL)"
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('createRgb：err==' + err)
      } else {
        console.info('createRgb：getRdbStore')
        rdbStore.executeSql(SQL_CREATE_TABLE, null, () => {
          promptAction.showToast({ message: "createRgb 成功" });
          console.info('createRgb：create table done.')
        })
      }
    })
  }

  UpdateDB() {
    this.version = 2
    new Migration(this.dbName, this.tableName, 2).addColumn("AGE", "INTEGER").execute(ctt, false);
  }

  async aboutToAppear() {
    ctt = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
  }

  insertData() {
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('insertData i insertData err==' + err)
      } else {
        const valueBucket: ValuesBucket = {
          "NAME": "Lisa"
        }
        rdbStore.insert("STUDENT", valueBucket, (err, ret) => {
          console.info("insertData i insert first done: " + ret)
          promptAction.showToast({ message: "insertData 成功,code:" + ret });
        })
      }
    })
  }

  newInsertData() {
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('insertData test：err==' + err)
      } else {
        const valueBucket: ValuesBucket = {
          "NAME": "Lisa",
          "AGE": 5
        }
        rdbStore.insert("STUDENT", valueBucket, (err, ret) => {
          promptAction.showToast({ message: "升级后添加数据 成功, code:" + ret });
          console.info("insert first done: " + ret)
        })
      }
    })
  }

  QueryDB1() {
    let that = this
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('test：err==' + err)
      } else {
        console.info('test：getRdbStore')
        let predicates = new dataRdb.RdbPredicates("STUDENT")
        predicates.equalTo("NAME", "Lisa")
        rdbStore.query(predicates, ["ID", "NAME"], (err, resultSet) => {
          let datum = new Array<Student>();
          while (resultSet.goToNextRow()) {
            let id = resultSet.getLong(resultSet.getColumnIndex("ID"))
            let name = resultSet.getString(resultSet.getColumnIndex("NAME"))
            let student = new Student();
            student.setId(id);
            student.setName(name);
            datum.push(student)
            console.info("id===>" + id + "name====>" + name)
          }
          that.arr = datum;
        })
      }
    })
  }

  BeiQueryDB1() {
    let dbName = 'testRgb-' + this.version + '.db'
    let that = this;
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('test i Backup to restore failed ,getRdbStore err: ' + err.message)
        return;
      }
      dataRdb.deleteRdbStore(ctt, that.dbName, (err) => {
        if (err) {
          console.error("test i Delete RdbStore failed, err: " + err)
          return
        }
        rdbStore.restore(dbName, (err) => {
          if (err) {
            console.error('Restore failed, err: ' + err)
            return
          }
          promptAction.showToast({ message: "从备份中恢复成功" });
          console.info('Restore success.')
        })
      })
    })
  }

  QueryDB() {
    let that = this;
    dataRdb.getRdbStore(ctt, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      if (err) {
        console.error('test:err==' + err)
      } else {
        console.info('test:getRdbStore')
        let predicates = new dataRdb.RdbPredicates("STUDENT")
        predicates.equalTo("NAME", "Lisa")
        rdbStore.query(predicates, ["ID", "NAME", "AGE"], (err, resultSet) => {
          let datum = new Array<Student>();
          while (resultSet.goToNextRow()) {
            let id = resultSet.getLong(resultSet.getColumnIndex("ID"))
            let name = resultSet.getString(resultSet.getColumnIndex("NAME"))
            let age = resultSet.getLong(resultSet.getColumnIndex("AGE"))
            let student = new Student();
            student.setId(id);
            student.setName(name);
            student.setAge(age);
            datum.push(student)
            console.info("id===>" + id + "name====>" + name + "age===>>" + age)
          }
          that.arr = datum;
        })
      }
    })
  }

  BeiDb() {
    let dbName = 'testRgb-' + this.version + '.db'
    Migration.backupDB(this.dbName, dbName, this.version, ctt, false)
  }

  async BeiDb22() {
    let daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    let database: Database = daoSession.getDatabase()
    let ctx = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
    let n = await DbUtils.executeSqlScript(ctx.resourceManager, database, "minimal-entity.sql");
    let that = this;
    let per = database.getRawDatabase().querySql("SELECT * from MINIMAL_ENTITY");
    per.then((resultSet) => {
      console.log("BeiDb22 ResultSet row count: " + resultSet.rowCount)
      let str = '';
      if (resultSet && resultSet.goToFirstRow()) {
        let colCount: number = resultSet.columnCount;
        do {
          for (let i = 0;i < colCount; i++) {
            let column = resultSet.getColumnName(i);
            let index = resultSet.getColumnIndex(column);
            let res = resultSet.getString(index);
            str += '{' + column + ':' + res + '},';
          }

        } while (resultSet.goToNextRow());
        that.importResult = str;
      }
    })
  }

  BeiQueryDB() {
    let that = this;
    try {
      dataRdb.getRdbStore(ctt, {
        name: 'testRgb-2.db',
        securityLevel: dataRdb.SecurityLevel.S1,
        encrypt: false
      }, (err, rdbStore) => {
        if (!err) {
          let predicates = new dataRdb.RdbPredicates("STUDENT")
          let datum = new Array<Student>();
          rdbStore.query(predicates, ["ID", "NAME", "AGE"], (err, resultSet) => {
            while (resultSet.goToNextRow()) {
              let id = resultSet.getLong(resultSet.getColumnIndex("ID"))
              let name = resultSet.getString(resultSet.getColumnIndex("NAME"))
              let age = resultSet.getLong(resultSet.getColumnIndex("AGE"))
              let student = new Student();
              student.setId(id);
              student.setName(name);
              student.setAge(age);
              datum.push(student)
            }
            that.arr = datum;
          })
        }
      })
    } catch (e) {
      const error = e as TypeError;
      console.error("err_msg:" + error.message + "--err:" + error.stack)
    }
  }

  build() {
    Flex({ direction: FlexDirection.Column }) {
      Toolbar({ title: 'UPGRADE', isBack: true })
      Flex({ direction: FlexDirection.Row, wrap: FlexWrap.Wrap }) {
        Button($r('app.string.Create_DB'))
          .fontSize(20)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.createRgb()
          })
        Button($r('app.string.Insert_Data'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.insertData()
          })
        Button($r('app.string.Backup_DB'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .fontColor(0xFFFFFF)
          .onClick(() => {
            this.BeiDb()
          })
          .backgroundColor(Color.Blue)
        Button($r('app.string.Restore_DB'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.BeiQueryDB1()
          })
        Button($r('app.string.Select_Data'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.QueryDB1()
          })
        Button($r('app.string.Upgrade_DB'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.UpdateDB()
          })
          .backgroundColor(Color.Red)
        Button($r('app.string.Insert_Data_After_Upgrade'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.newInsertData()
          })
          .backgroundColor(Color.Red)

        Button($r('app.string.Select_Data_After_Upgrade'))
          .fontSize(20)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.QueryDB()
          })
          .backgroundColor(Color.Red)
        Button($r('app.string.Select_Backup_Data_After_Upgrade'))
          .fontSize(15)
          .height(45)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.BeiQueryDB()
          })
          .backgroundColor(Color.Red)
        Button($r('app.string.Import_Data'))
          .fontSize(20)
          .height(60)
          .margin({ left: 18, top: 5 })
          .onClick(() => {
            this.BeiDb22()
          })
          .backgroundColor(Color.Blue)

      }.margin({ top: 12 })

      Flex({}) {
        List({ space: 20, initialIndex: 0 }) {
          ForEach(this.arr, (item: Student) => {
            ListItem() {
              Flex({ direction: FlexDirection.Column }) {
                Text('' + JSON.stringify(item))
                  .fontSize(13)
              }.width('100%')
            }
          }, (item: Student) => {
            return item.getId() + ""
          })
        }

      }.margin({ top: 12 })

      Text(this.getResourceString($r('app.string.Import_Data_Result')) + this.importResult)
        .fontSize(20)
        .margin({ left: 18, top: 5 })

    }
    .width('100%')
    .height('100%')
  }
}