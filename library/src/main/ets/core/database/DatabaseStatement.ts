/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on DatabaseStatement.java written by
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
import relationalStore from '@ohos.data.relationalStore'
import { Transaction } from './StandardDatabase';
import { ValuesBucket } from '@kit.ArkData';

export interface DatabaseStatement {
  executeDelete(transaction:Transaction|null): Promise<number>;
  executeDeleteSync(transaction:Transaction|null): number;

  executeUpdate(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): Promise<number>;
  executeUpdateSync(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): number;

  executeInsert(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): Promise<number>;
  executeInsertSync(transaction:Transaction|null,conflictResolution?: relationalStore.ConflictResolution): number;

  executeInsertBatch(transaction:Transaction|null);
  executeInsertBatchSync(transaction:Transaction|null);

  clearBindings();

  pushValuesBucket(values:ValuesBucket);

  setValuesBucket(values:ValuesBucket)

  getRawStatement(): SQLiteStatement;
}