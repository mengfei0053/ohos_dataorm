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

import { Columns, ColumnType, Entity } from '@ohos/dataorm';
import { One } from './One';

/**
 * 测试继承One
 */
@Entity('one_plus')
export class OnePlus extends One {

  @Columns({ columnName: 'four', types: ColumnType.str })
  four: string;

  constructor(one?: number, two?: string, three?: string, four?: string) {
    super(one, two, three);
    this.four = four;
  }

  public getFour(): string {
    return this.four;
  }

  public setFour(four: string) {
    return this.four = four;
  }

}