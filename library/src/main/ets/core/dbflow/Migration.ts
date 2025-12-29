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
import { ColumnTypeValue } from '../ColumnType';
import { DaoLog } from '../DaoLog';
import { DaoTraceSpace, DaoTraceUtil } from '../trace/DaoTraceUtil';

export class Migration {
  // 数据库名称
  private dbName: string = "";
  // 数据库表名
  private tableName: string = "";
  // 数据库版本(默认为1)
  private dbVersion: number = 1;
  // 对表进行修改的Alter语句(ALTER TABLE 语句用于在已有的表中添加、修改或删除列。)
  private alters: Array<string> = [];

  /**
   * dbName:数据库名称
   * table:表名称
   * dbVersion:数据库版本
   * */
  constructor(dbName: string, tableName: string, dbVersion: number) {
    this.tableName = tableName;
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  // 新增列操作(需要新增的列名以及列数据类型名称,返回当前类实例)
  addColumn(columnName: string, columnType: ColumnTypeValue | string): Migration {
    this.alters.push(`ALTER TABLE "${this.tableName}" ADD COLUMN "${columnName}" ${columnType}`);
    return this;
  }

  // 删除列操作(需要删除的列名,返回当前类实例)
  deleteColumn(columnName: string): Migration {
    this.alters.push(`ALTER TABLE "${this.tableName}" DROP COLUMN "${columnName}"`);
    return this;
  }

  // 对库进行备份
  /*
   * name:数据库名称
   **/
  static backupDB(dbName: string, backupDbName: string, dbVersion: number, context: any, encrypt: boolean) {
    dataRdb.getRdbStore(context, {
      name: dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: encrypt
    }, (err, rdbStore) => {
      if (err) {
        DaoTraceUtil.startError("Migration.backupDB.error", DaoTraceSpace.TraceType.MIGRATION);
        DaoLog.e('test i Backup failed ,getRdbStore err: ' + err.message)
        DaoTraceUtil.finish("Migration.backupDB.error");
        return;
      }
      dataRdb.deleteRdbStore(context, backupDbName, (err) => {
        if (err) {
          DaoTraceUtil.startError("Migration.deleteRdbStore.error", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.e("test i Delete RdbStore failed, err: " + err)
          DaoTraceUtil.finish("Migration.deleteRdbStore.error");
          return
        }
        DaoTraceUtil.startInfo("Migration.deleteRdbStore", DaoTraceSpace.TraceType.MIGRATION);
        DaoLog.d("test i Delete RdbStore successfully.")
        DaoTraceUtil.finish("Migration.deleteRdbStore");
        let promiseBackup = rdbStore.backup(backupDbName)
        promiseBackup.then(() => {
          DaoTraceUtil.startInfo("Migration.backup", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.i('test i Backup success.')
          DaoTraceUtil.finish("Migration.backup");
        }).catch((err) => {
          DaoTraceUtil.startError("Migration.backup.error", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.e('test i Backup failed, err: ' + err)
          DaoTraceUtil.finish("Migration.backup.error");
        })
      })
    })
  }

  // 修改列操作(需要修改的列名以及列数据类型名称,返回当前类实例)
  updateColumn(columnName: string, columnType: ColumnTypeValue): Migration {
    this.alters.push(`ALTER TABLE "${this.tableName}" ADD COLUMN "${columnName}__new__" ${columnType}`);
    this.alters.push(`UPDATE "${this.tableName}" SET "${columnName}__new__" = "${columnName}"`);
    this.alters.push(`ALTER TABLE "${this.tableName}" DROP COLUMN "${columnName}"`);
    this.alters.push(`ALTER TABLE "${this.tableName}" RENAME COLUMN "${columnName}__new__" TO "${columnName}"`);
    return this;
  }

  // 列操作(需要将具体的列操作以SQL语句的方式传入并执行,具体规范参考 SQLite中 ALTER TABLE 语句)
  Alter(alters: string): Migration {
    this.alters.push(alters);
    return this;
  }

  /**
   * 执行列操作并升级数据库
   * @param context
   * @param encrypt
   * @returns
   * @deprecated since 2.1.1
   * @useinstead Migration#executeAsync
   */
  public execute(context: any, encrypt: boolean, customDir?:string): Migration {
    let that = this
    dataRdb.getRdbStore(context, {
      name: that.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: encrypt,
      customDir: customDir
    }, (err, rdbStore) => {
      if (err) {
        DaoTraceUtil.startError("Migration.execute.error", DaoTraceSpace.TraceType.MIGRATION);
        DaoLog.e(`Migration ${err}`)
        DaoTraceUtil.finish("Migration.execute.error");
      } else {
        try {
          rdbStore.beginTransaction()
          for (let i = 0; i < that.alters.length; i++) {
            let it = that.alters[i];
            rdbStore.executeSync(it, null);
          }
          rdbStore.commit()
          DaoTraceUtil.startDebug("Migration.success", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.d(`Migration success`);
          DaoTraceUtil.finish("Migration.success");
        } catch (e) {
          rdbStore.rollBack();
          DaoTraceUtil.startError("Migration.error", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.e(`Migration ${e}`);
          DaoTraceUtil.finish("Migration.error");
        }
      }
    })
    return this;
  }

  /**
   * 异步执行列操作并升级数据库
   * @param context
   * @param encrypt
   * @returns
   */
  public async executeAsync(context: any, encrypt: boolean, customDir?: string): Promise<any> {
    let rdbStore: dataRdb.RdbStore = await dataRdb.getRdbStore(context, {
      name: this.dbName,
      securityLevel: dataRdb.SecurityLevel.S1,
      encrypt: encrypt,
      customDir: customDir,
    })
    try {
      rdbStore.beginTransaction();
      for (let i = 0; i < this.alters.length; i++) {
        try {
          await rdbStore.executeSql(this.alters[i], null)
        } catch (e) {
          DaoTraceUtil.startError("Migration.executeSql.error", DaoTraceSpace.TraceType.MIGRATION);
          DaoLog.e(`Migration: ${e}`)
          DaoTraceUtil.finish("Migration.executeSql.error");
        }
      }
      rdbStore.commit();
      DaoTraceUtil.startDebug("Migration.done", DaoTraceSpace.TraceType.MIGRATION);
      DaoLog.d('Migration: done.')
      DaoTraceUtil.finish("Migration.done");
    } catch (e) {
      rdbStore.rollBack();
      DaoTraceUtil.startError("Migration.executeAsync.error", DaoTraceSpace.TraceType.MIGRATION);
      DaoLog.e(`Migration: ${e}`);
      DaoTraceUtil.finish("Migration.executeAsync.error");
    }
    return this;
  }
}