/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { beforeAll, describe, expect, it } from '@ohos/hypium';
import {
  BaseDao,
  ColumnType,
  DaoMaster,
  DaoSession,
  Database,
  GlobalContext,
  Migration,
  Property
} from '@ohos/dataorm';
import { Student } from '../../../main/ets/pages/Student'
import { Classes } from '../../../main/ets/pages/Classes';
import { Teacher } from '../../../main/ets/pages/Teacher'
import { DateEntity } from '../../../main/ets/pages/DateEntity'
import { JoinManyToDateEntity } from '../../../main/ets/pages/JoinManyToDateEntity'
import { CTXInstance } from './CTXInstance';
import { ExampleOpenHelper } from './ExampleOpenHelper';
import dataRdb from '@ohos.data.relationalStore'
import { BusinessError } from '@kit.BasicServicesKit'

export default function AnnotationPageTest() {

  describe('AnnotationPageTest', () => {
    let daoSession: DaoSession;
    let studentDao: BaseDao<Student, number>;
    let ctt: Context = CTXInstance.getInstance().getContext();
    const dbName: string = "notes.db";

    beforeAll(async () => {
      let newVersion = 2;
      let helper: ExampleOpenHelper = new ExampleOpenHelper(ctt, "notes.db");
      helper.setEncrypt(true);
      await helper.setVersion(newVersion)
      helper.setEntities(Student, Teacher, Classes, JoinManyToDateEntity, DateEntity);
      let db: Database = await helper.getWritableDb();
      db.name = "notes.db";
      daoSession = new DaoMaster(db).newSession();
      studentDao = daoSession.getBaseDao(Student);

      let ctx = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;

      const rdbStore = await dataRdb.getRdbStore(ctx, {
        name: dbName,
        securityLevel: dataRdb.SecurityLevel.S1,
        encrypt: false
      })
      const fileData = await ctx.resourceManager.getRawFileContent("add_student_teacher.sql")
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
        promise.then().catch((err: BusinessError) => {
          console.error("ExecuteSql failed, err:" + err)
        })
      }
    })

    /**
     * loadDeep
     */
    it('loadDeep', 0, async () => {
      let studentId = 1
      let student: Student = await studentDao.loadDeep(studentId);
      expect(typeof student.teacher.id).assertEqual("number");
      expect(typeof student.teacher.name).assertEqual("string");
    })

    /**
     * queryDeep
     */
    it('queryDeep', 0, async () => {
      let columnName = studentDao.getPkProperty().columnName
      let entityList = await studentDao.queryDeep("WHERE T." + columnName + "=?", ["1"]);
      let entity3: Student = entityList[0];
      expect(typeof entity3.teacher.id).assertEqual("number");
      expect(typeof entity3.teacher.name).assertEqual("string");
    })

    /**
     * queryToManyListByColumnName
     */
    it('queryToManyListByColumnName', 0, async () => {
      let teacherId: string[] = ["1"]
      let data = await studentDao.queryToManyListByColumnName("students", teacherId, true)
      expect(typeof data[0].id).assertEqual("number");
      expect(typeof data[0].name).assertEqual("string");
      expect(typeof data[0].teacher.id).assertEqual("number");
      expect(typeof data[0].teacher.name).assertEqual("string");
      expect(typeof data[1].id).assertEqual("number");
      expect(typeof data[1].name).assertEqual("string");
      expect(typeof data[1].teacher.id).assertEqual("number");
      expect(typeof data[1].teacher.name).assertEqual("string");
    })

  })
}