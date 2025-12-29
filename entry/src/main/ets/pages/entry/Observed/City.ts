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

import { Columns, ColumnType, Entity, Id, NotNull } from '@ohos/dataorm';

@Observed
@Entity('City')
export class City{
  @Id()
  @Columns({ columnName: 'cityId', types: ColumnType.num })
  cityId: number

  @NotNull()
  @Columns({ columnName: 'cityName', types: ColumnType.str })
  cityName: string;

  @NotNull()
  @Columns({ columnName: 'cityParentName', types: ColumnType.str })
  cityParentName: string;

  @NotNull()
  @Columns({ columnName: 'secretary', types: ColumnType.str })
  secretary:string

  constructor(id?: number, cityName?: string, secretary?: string,cityParentName?: string) {
    this.cityId = id;
    this.cityName = cityName
    this.secretary = secretary
    this.cityParentName= cityParentName;
  }
}