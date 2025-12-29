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

import { Columns, ColumnType, Id, Index, NotNull, Transient, Unique } from '@ohos/dataorm'

/**
 * 定义继承的基类
 */
export class One {

  @Id({ isPrimaryKey: true, autoincrement: true })
  @Columns({ columnName: 'one', types: ColumnType.num })
  @NotNull()
  one: number;

  @Index()
  @Unique()
  @Columns({ columnName: 'two', types: ColumnType.str })
  two: string;

  @Transient()
  three: string;

  constructor(one?: number, two?: string, three?: string) {
    this.one = one;
    this.two = two;
    this.three = three;
  }

  public getOne(): number {
    return this.one;
  }

  public setOne(one: number) {
    this.one = one;
  }

  public getTwo(): string {
    return this.two;
  }

  public setTwo(two: string) {
    this.two = two;
  }

  public getThree(): string {
    return this.three;
  }

  public setThree(three: string) {
    this.three = three;
  }
}