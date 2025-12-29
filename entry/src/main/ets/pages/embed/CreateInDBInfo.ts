/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
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

import { Columns, Entity, ColumnType, Id } from '@ohos/dataorm';

@Entity("CreateInDBInfo",[{ value: 'name,time DESC', unique: true }],false)
export class CreateInDBInfo {
  @Columns({ columnName: 'name', types: ColumnType.str })
  name: string;
  @Id()
  @Columns({ columnName: 'time', types: ColumnType.num })
  time: number;

  constructor(
    name?: string,
    time?: number
  ) {
    this.name = name;
    this.time = time;
  }
}