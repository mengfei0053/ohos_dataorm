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
import { BaseDao } from '@ohos/dataorm'
import { DaoSession } from '@ohos/dataorm'
import { GlobalContext } from '@ohos/dataorm'
import { Student } from './Student'
import { Teacher } from './Teacher'
import { DateEntity } from './DateEntity'
import { BusinessError } from '@ohos.base'

@Entry
@Component
struct Annotation {
  daoSession: DaoSession | null = null;
  @State text: string = this.getResourceString($r('app.string.Annotation_TIPS'))
  private dbName: string = "notes.db";
  private studentDao: BaseDao<Student, number> | null = null;
  private dateEntityDao: BaseDao<DateEntity, number> | null = null;
  private teacherDao: BaseDao<Teacher, number> | null = null;

  getResourceString(res:Resource){
    return getContext().resourceManager.getStringSync(res.id)
  }

  build() {
    Flex({ direction: FlexDirection.Column,
      alignItems: ItemAlign.Center,
      justifyContent: FlexAlign.Center }) {
      Button('add data')
        .fontSize(20)
        .fontWeight(FontWeight.Bold).onClick(() => {
        this.addTestData()
      })
      Button("ToOne_loadDeep").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.loadDeep()

      })
      Button("ToOne_queryDeep")
        .fontSize(20).margin({ top: 20 })
        .fontWeight(FontWeight.Bold).onClick(() => {
        this.queryByToOneFunctionTest()

      })

      Button("ToMany_ByToMany").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryByToManyFunctionTest()

      })

      Button("ToMany_ByJoinEntity").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryByJoinEntityFunctionTest()

      })
      Button($r('app.string.Query_added_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryData()

      })
      Text(this.text).fontSize(15).fontColor(Color.Black).margin({ top: 20 })


    }
    .width('100%')
    .height('100%')
  }

  addTestData() {
    this.executeSql("add_student_teacher.sql")
  }

  async loadDeep() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.studentDao = this.daoSession.getBaseDao(Student);
    let studentId = 1
    let student: Student = await this.studentDao.loadDeep(studentId);
    this.text = ''
    this.text = "loadDeep--" + JSON.stringify(student)
  }

  async executeSql(fileName: string) {
    let ctx = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
    dataRdb.getRdbStore(ctx, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, (err, rdbStore) => {
      ctx.resourceManager.getRawFileContent(fileName).then((fileData: Uint8Array) => {
        let dataString = "";
        for (let i = 0; i < fileData.length; i++) {
          dataString += String.fromCharCode(fileData[i]);
        }
        let lines: string[] = dataString.split("\r\n")
        if (!lines) {
          return;
        }
        for (let index = 0; index < lines.length; index++) {
          const sql = lines[index];
          let promise = rdbStore.executeSql(sql)
          promise.then(() => {
            console.info('Add data done.')
          }).catch((err: BusinessError) => {
            console.error("ExecuteSql failed, err:" + err)
          })
        }
      })
    })

  }

  async queryByToManyFunctionTest() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.studentDao = this.daoSession.getBaseDao(Student);
    let teacherId: string[] = ["1"]
    let data = await this.studentDao.queryToManyListByColumnName("students", teacherId, true)
    this.text = ''
    data.forEach(element => {
      this.text += "tonMany--" + JSON.stringify(element) + '\n'
    });
  }

  async queryByJoinEntityFunctionTest() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.dateEntityDao = this.daoSession.getBaseDao(DateEntity);
    let teacherId: string[] = ["11"]
    let data = await this.dateEntityDao.queryToManyListByColumnName("dateEntityList", teacherId)
    this.text = ''
    data.forEach(element => {
      this.text += "JoinEntry--" + JSON.stringify(element) + '\n'
    });
  }

  async queryByToOneFunctionTest() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.studentDao = this.daoSession.getBaseDao(Student);
    let columnName = this.studentDao.getPkProperty().columnName
    let entityList = await this.studentDao.queryDeep("WHERE T." + columnName + "=?", ["1"]);
    let entity3: Student = entityList[0];
    this.text = ''
    this.text += "ToOne--" + JSON.stringify(entity3)

  }

  queryData() {
    let that = this
    let ctx = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
    dataRdb.getRdbStore(ctx, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: false
    }, async (err, rdbStore) => {
      let promise = rdbStore.querySql("SELECT ID,NAME,TID FROM STUDENT")
      that.text = ''
      promise.then((resultSet) => {
        while (resultSet.goToNextRow()) {
          let ID = resultSet.getLong(resultSet.getColumnIndex("ID"))
          let NAME = resultSet.getString(resultSet.getColumnIndex("NAME"))
          let TID = resultSet.getString(resultSet.getColumnIndex("TID"))
          that.text += "STUDENT-{--ID-" + ID + "-----NAME-" + NAME + "---TID---" + TID + "--}\n"
        }
      }).catch((err: BusinessError) => {
        console.error("Query failed, err: " + err)
      })
      let promiseTeacher = rdbStore.querySql("SELECT ID,NAME FROM TEACHER")
      promiseTeacher.then((resultSet) => {
        while (resultSet.goToNextRow()) {
          let ID = resultSet.getLong(resultSet.getColumnIndex("ID"))
          let NAME = resultSet.getString(resultSet.getColumnIndex("NAME"))
          that.text += "Teacher-{--ID-" + ID + "-----NAME-" + NAME + "}\n"
        }
      }).catch((err: BusinessError) => {
        console.error("Query failed, err: " + err)
      })
    })
  }
}