/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on StandardDatabase.java written by
 * Copyright (C) 2011-2016 Markus Junginger, greenrobot (http://greenrobot.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import dataRdb from '@ohos.data.relationalStore'
import { Database } from './Database'
import { DatabaseStatement } from './DatabaseStatement';
import { SQLiteStatement } from './SQLiteStatement';
import { StandardDatabaseStatement } from './StandardDatabaseStatement';
import { OnTableChangedListener } from '../dbflow/listener/OnTableChangedListener'
import { TableAction } from '../dbflow/listener/TableAction';
import { DaoLog } from '../DaoLog';
import { DaoTraceSpace, DaoTraceUtil } from '../trace/DaoTraceUtil';

export type Transaction = ESObject;

export class StandardDatabase implements Database {
  private delegate: dataRdb.RdbStore;
  protected myOnTableChangedListener = null;
  name: string;
  customDir: string;

  constructor(delegate: dataRdb.RdbStore, dbName?: string, customDir?: string) {
    this.delegate = delegate;
    this.name = dbName;
    this.customDir = customDir;
  }

  async rawQuery(predicates: dataRdb.RdbPredicates, selectionArgs: string[]): Promise<any> {
    DaoLog.i(`StandardDatabase query selectionArgs:${selectionArgs}`)
    let data = await this.delegate.query(predicates, selectionArgs)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.QUERY);
    return data;
  }

  rawQuerySync(predicates: dataRdb.RdbPredicates, selectionArgs: string[]): any {
    let data = this.delegate.querySync(predicates, selectionArgs)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.QUERY);
    return data;
  }

  async rawQueries(sql: string, selectionArgs?: Array<any>): Promise<any> {
    DaoLog.i(`StandardDatabase query sql:${sql} selectionArgs:${selectionArgs}`)
    let data = await this.delegate.querySql(sql, selectionArgs)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.QUERY);
    return data;
  }

  rawQueriesSync(sql: string, selectionArgs?: Array<any>): any {
    let data = this.delegate.querySqlSync(sql, selectionArgs)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.QUERY);
    return data;
  }

  async Delete(transaction: Transaction | null, predicates: dataRdb.RdbPredicates): Promise<any> {
    DaoLog.i(`StandardDatabase delete`);
    let data = await this.delegate.delete(predicates)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.DELETE);
    return data;
  }

  DeleteSync(transaction: Transaction | null, predicates: dataRdb.RdbPredicates): any {
    DaoLog.i(`StandardDatabase deleteSync`);
    let data = this.delegate.deleteSync(predicates)
    this.myOnTableChangedListener?.onTableChanged(data, TableAction.DELETE);
    return data;
  }

  async beginTransactionAsync(): Promise<Transaction> {
    if (this.delegate["createTransaction"]) {
      DaoLog.i(`StandardDatabase createTransaction`);
      return this.delegate["createTransaction"]();
    } else {
      return null;
    }
  }

  async beginTransaction() {
    this.delegate.beginTransaction()
  }

  endTransaction() {
    this.delegate.commit()
  }

  endTransactionAsync(transaction?: Transaction): Promise<void> {
    return transaction?.commit()
  }

  rollBack() {
    try {
      this.delegate.rollBack()
    } catch (e) {
      DaoLog.i(`rollBack e:${e?.message}`);
    }
  }

  rollBackAsync(transaction?: Transaction): Promise<void> {
    return transaction?.rollback();
  }

  async execSQL(sql: string, bindArgs?: any[]) {
    DaoTraceUtil.startInfo('StandardDatabase.execSQL', DaoTraceSpace.TraceType.CRUD)
    DaoLog.i(`execSQL sql:${sql} bindArgs:${bindArgs}`);
    let promise = this.delegate.executeSql(sql, bindArgs);
    await promise.then(async (data) => {
      DaoTraceUtil.finish('StandardDatabase.execSQL')
      DaoLog.i('execSQL done.');
    })
  }

  compileStatement(sql: dataRdb.RdbPredicates, tableName?: string): DatabaseStatement {
    let sQLiteStatement = new SQLiteStatement(sql, this.delegate, tableName);
    sQLiteStatement.setStandardDatabase(this);
    return new StandardDatabaseStatement(sQLiteStatement);
  }

  getRawDatabase(): any {
    return this.delegate;
  }

  getSQLiteDatabase(): dataRdb.RdbStore {
    return this.delegate;
  }

  addTableChangedListener(onTableChangedListener: OnTableChangedListener<any>): void {
    this.myOnTableChangedListener = onTableChangedListener
  }

  getTableChangedListener(): OnTableChangedListener<any> {
    return this.myOnTableChangedListener
  }

  removeTableChangedListener() {
    this.myOnTableChangedListener = null
  }
}
