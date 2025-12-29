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

/**
 * Marks field is the primary key of the entity's table
 */
export function Id(v?: {
  isPrimaryKey?: boolean,
  autoincrement?: boolean
}):PropertyDecorator {
  return (target, primaryKey) => {
    v = v ?? {
      isPrimaryKey: true,
      autoincrement: false
    }
    v.isPrimaryKey = v.isPrimaryKey ?? true
    v.autoincrement = v.autoincrement ?? false
    let prototype = target as any;
    prototype.Columns = prototype.Columns ?? {};
    prototype.Columns[primaryKey] = prototype.Columns[primaryKey] ?? {};
    prototype.Columns[primaryKey].isPrimaryKey = v.isPrimaryKey;
    prototype.Columns[primaryKey].autoincrement = v.autoincrement;
  };
}