/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on StandardDatabaseStatement.java written by
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

import { SQLiteStatement } from './SQLiteStatement'
import { DatabaseStatement } from './DatabaseStatement';
import { relationalStore, ValuesBucket } from '@kit.ArkData';
import { Transaction } from './StandardDatabase';

export class StandardDatabaseStatement implements DatabaseStatement {
  delegate: SQLiteStatement;

  public constructor(delegate: SQLiteStatement) {
    this.delegate = delegate;
  }

  async executeDelete(transaction:Transaction|null): Promise<number> {
    return await this.delegate.executeDelete(transaction);
  }

  executeDeleteSync(transaction:Transaction|null): number {
    return this.delegate.executeDeleteSync(transaction);
  }

  async executeUpdate(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    return await this.delegate.executeUpdate(transaction,conflictResolution);
  }

  executeUpdateSync(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): number {
    return this.delegate.executeUpdateSync(transaction,conflictResolution);
  }

  async executeInsert(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): Promise<number> {
    return await this.delegate.executeInsert(transaction,conflictResolution);
  }
  
  executeInsertSync(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): number {
    return this.delegate.executeInsertSync(transaction,conflictResolution);
  }

  async executeInsertBatch(transaction:Transaction|null){
    return await this.delegate.executeInsertBatch(transaction)
  }

  executeInsertBatchSync(transaction:Transaction|null){
    return this.delegate.executeInsertBatchSync(transaction)
  }

  pushValuesBucket(value:ValuesBucket){
    this.delegate.pushValuesBucket(value);
  }

  setValuesBucket(value: ValuesBucket): void {
    this.delegate.setValuesBucket(value)
  }

  clearBindings() {
    this.delegate.clearBindings();
  }

  getRawStatement(): SQLiteStatement {
    return this.delegate;
  }
}
