/*
  * Copyright (c) 2022 Huawei Device Co., Ltd.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

import dataRdb from '@ohos.data.relationalStore'
import { StandardDatabase, Transaction } from './StandardDatabase'
import { TableAction } from '../dbflow/listener/TableAction'
import { relationalStore, ValuesBucket } from '@kit.ArkData';
import { DaoLog } from '../DaoLog';
import { DaoTraceSpace, DaoTraceUtil } from '../trace/DaoTraceUtil';

export class SQLiteStatement {
  public sql: dataRdb.RdbPredicates;
  public bindArgs: any[];
  public tableName: string;
  private db: dataRdb.RdbStore;
  private standardDatabase: StandardDatabase;
  private valueBucket: {};
  private valueBuckets: Record<string, any>[];
  public conflictResolution: relationalStore.ConflictResolution = relationalStore.ConflictResolution.ON_CONFLICT_NONE

  constructor(sql: dataRdb.RdbPredicates, db?: dataRdb.RdbStore, tableName?: string) {
    this.sql = sql;
    if (tableName) {
      this.tableName = tableName
    }
    this.db = db;
  }

  setStandardDatabase(standardDatabase: StandardDatabase) {
    this.standardDatabase = standardDatabase;
  }

  async executeDelete(transaction: Transaction | null): Promise<number> {
    DaoTraceUtil.startDebug("SQLiteStatement.executeDelete", DaoTraceSpace.TraceType.CRUD)
    DaoLog.d(`executeDelete transaction:${transaction?true:false} sql:${this.sql} tableName:${this.tableName}`)
    return (transaction ?? this.db).delete(this.sql).then((data) => {
      this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.DELETE);
      DaoTraceUtil.finish("SQLiteStatement.executeDelete")
      DaoLog.d(`executeDelete result:${data}`)
      return data;
    })
  }

  executeDeleteSync(transaction: Transaction | null): number {
    DaoLog.d(`executeDeleteSync transaction:${transaction?true:false} sql:${this.sql} tableName:${this.tableName}`)
    const data = (transaction ?? this.db).deleteSync(this.sql)
    this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.DELETE);
    DaoLog.d(`executeDeleteSync result:${data}`)
    return data;
  }

  async executeUpdate(transaction: Transaction | null,
    conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    DaoTraceUtil.startDebug("SQLiteStatement.executeUpdate", DaoTraceSpace.TraceType.CRUD)
    DaoLog.d(`executeUpdate transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBucket)}`)
    return (transaction ?? this.db).update(this.valueBucket, this.sql, conflictResolution ?? this.conflictResolution)
      .then((data) => {
        this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.UPDATE);
        DaoTraceUtil.finish("SQLiteStatement.executeUpdate")
        DaoLog.d(`executeUpdate result:${data}`)
        return data;
      })
  }

  executeUpdateSync(transaction: Transaction | null,
    conflictResolution?: relationalStore.ConflictResolution): number {
    DaoLog.d(`executeUpdateSync transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBucket)}`)
    const data =  (transaction ?? this.db).updateSync(this.valueBucket, this.sql, conflictResolution ?? this.conflictResolution)
    this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.UPDATE);
    DaoLog.d(`executeUpdateSync result:${data}`)
    return data;
  }

  async executeInsert(transaction: Transaction | null,
    conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    DaoTraceUtil.startDebug("SQLiteStatement.executeInsert", DaoTraceSpace.TraceType.CRUD)
    DaoLog.d(`executeInsert transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBucket)}`)
    return (transaction ?? this.db).insert(this.tableName, this.valueBucket,
      conflictResolution ?? this.conflictResolution).then((data) => {
      this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.INSERT);
      DaoTraceUtil.finish("SQLiteStatement.executeInsert")
      DaoLog.d(`executeInsert result:${data}`);
      return data;
    })
  }

  executeInsertSync(transaction: Transaction | null,
    conflictResolution?: relationalStore.ConflictResolution): number {
    DaoLog.d(`executeInsertSync transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBucket)}`)
    const data = (transaction ?? this.db).insertSync(this.tableName, this.valueBucket,
      conflictResolution ?? this.conflictResolution)
    this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.INSERT);
    DaoLog.d(`executeInsertSync result:${data}`);
    return data
  }

  async executeInsertBatch(transaction: Transaction | null) {
    DaoTraceUtil.startDebug("SQLiteStatement.executeInsertBatch", DaoTraceSpace.TraceType.CRUD)
    DaoLog.d(`executeInsertBatch transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBuckets)}`)
    return (transaction ?? this.db).batchInsert(this.tableName, this.valueBuckets).then((data) => {
      this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.INSERT);
      DaoTraceUtil.finish("SQLiteStatement.executeInsertBatch")
      DaoLog.d(`executeInsertBatch result:${data}`);
      this.valueBuckets = [];
      return data;
    })
  }

  executeInsertBatchSync(transaction: Transaction | null) {
    DaoTraceUtil.startDebug("SQLiteStatement.executeInsertBatchSync", DaoTraceSpace.TraceType.CRUD)
    DaoLog.d(`executeInsertBatchSync transaction:${transaction?true:false} tableName:${this.tableName} value:${DaoLog.stringify(this.valueBuckets)}`)
    const data = (transaction ?? this.db).batchInsertSync(this.tableName, this.valueBuckets);
    this.standardDatabase.getTableChangedListener()?.onTableChanged(data, TableAction.INSERT);
    DaoTraceUtil.finish("SQLiteStatement.executeInsertBatchSync")
    DaoLog.d(`executeInsertBatchSync result:${data}`);
    this.valueBuckets = [];
    return data;
  }

  setConflictResolution(conflictResolution) {
    this.conflictResolution = conflictResolution;
    return this;
  }

  simpleQueryForBlobFileDescriptor(): any {
    let t: any;
    return t;
  }

  pushValuesBucket(values: ValuesBucket) {
    this.valueBuckets.push(values);
  }

  setValuesBucket(value: ValuesBucket) {
    this.valueBucket = value;
  }

  clearBindings() {
    DaoLog.d(`clearBindings`)
    this.bindArgs = [];
    this.valueBucket = {};
    this.valueBuckets = [];
  }
}