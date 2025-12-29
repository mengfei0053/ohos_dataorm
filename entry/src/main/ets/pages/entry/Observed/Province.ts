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

import { Columns, ColumnType, Entity, Id, OrderBy, ToMany } from '@ohos/dataorm';
import { City } from './City';

@Observed
@Entity('Province')
export class Province {
  @Id({ isPrimaryKey: true })
  @Columns({ columnName: 'id', types: ColumnType.num })
  id: number;

  @Columns({ columnName: 'province', types: ColumnType.str })
  province: string

  @ToMany({ targetClsName: "City", joinProperty: [{ name: "province", referencedName: "cityParentName" }] })
  @OrderBy("cityId ASC")
  citys: Array<City>

  constructor(id?: number, province?: string, citys?: Array<City>) {
    this.id = id;
    this.province = province
    this.citys = citys
  }
}