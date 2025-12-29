/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on Database.java written by
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

import { DatabaseStatement } from './DatabaseStatement';
import { OnTableChangedListener } from '../dbflow/listener/OnTableChangedListener'
import { relationalStore } from '@kit.ArkData';
import { Transaction } from './StandardDatabase';

/**
 * Database abstraction used internally
 */
export interface Database {
  name: string;
  customDir: string;
  rawQuery(predicates: relationalStore.RdbPredicates, selectionArgs?: string[]): Promise<any>;
  rawQuerySync(predicates: relationalStore.RdbPredicates, selectionArgs?: string[]): any;

  rawQueries(sql: string, selectionArgs?: Array<any>): Promise<any>;
  rawQueriesSync(sql: string, selectionArgs?: Array<any>): any;

  Delete(transaction:Transaction|null,predicates: relationalStore.RdbPredicates): Promise<number>;
  DeleteSync(transaction:Transaction|null,predicates: relationalStore.RdbPredicates): number;

  execSQL(sql: string, bindArgs?: Array<any>);

  beginTransaction();

  beginTransactionAsync(): Promise<Transaction>;

  endTransaction();

  endTransactionAsync(transaction:Transaction):Promise<void>

  rollBack();

  rollBackAsync(transaction:Transaction):Promise<void>;

  execSQL(sql: string, bindArgs: any[]);

  compileStatement(sql: relationalStore.RdbPredicates, tableName?: string): DatabaseStatement;

  getRawDatabase(): relationalStore.RdbStore;

  /**
   * 添加监听
   */
  addTableChangedListener(onTableChangedListener: OnTableChangedListener<any>);
  /**
   * 获取监听
   */
  getTableChangedListener(): OnTableChangedListener<any>
  /**
   * 移除监听
   */
  removeTableChangedListener();
}
