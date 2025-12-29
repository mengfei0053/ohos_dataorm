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

import { Columns, ColumnType, Entity, NotNull, Union } from '@ohos/dataorm';

@Entity("PEOPLE")
export class People {

  @NotNull()
  @Union()
  @Columns({ columnName: "FIRST_NAME", types: ColumnType.str })
  firstName: string;

  @NotNull()
  @Union()
  @Columns({ columnName: "LAST_NAME", types: ColumnType.str })
  lastName: string;

  @Columns({ columnName: "AGE", types: ColumnType.num })
  age: number;

  constructor(firstName: string, lastName: string, age: number) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }
}
