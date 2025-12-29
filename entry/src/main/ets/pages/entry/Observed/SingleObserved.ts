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

import { Columns, ColumnType, Entity, Id } from '@ohos/dataorm';

@Observed
@Entity("SINGLE_OBSERVED",[{ value: 'pls DESC', unique: true }])
export class SingleObserved {
  @Columns({ columnName: 'single', types: ColumnType. real})
  public single: boolean;

  @Columns({ columnName: 'pls', types: ColumnType.str })
  pls: string;

  @Columns({ columnName: 'clo', types: ColumnType.str })
  clo: string;

  @Id()
  @Columns({ columnName: 'ID', types: ColumnType.num })
  public id: number;

  constructor(single: boolean, id: number, clo:string,pls:string) {
    this.single = single;
    this.clo = clo;
    this.id = id;
    this.pls = pls;
  }
}