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

import { Columns, ColumnType, Embedded, Entity, Id } from '@ohos/dataorm';
import { ChildObs } from './ChildObs';

@Observed
@Entity("PARENT_OBS",[{ value: 'userName DESC', unique: true }])
export class ParentObs {

  @Embedded({ prefix: "m_", targetClass: ChildObs })
  public child: ChildObs;

  @Columns({ columnName: 'userName', types: ColumnType.str })
  userName: string;

  @Id()
  @Columns({ columnName: 'ID', types: ColumnType.num })
  public id: number;

  constructor(child: ChildObs, id: number, name:string) {
    this.child = child;
    this.userName = name;
    this.id = id;
  }
}