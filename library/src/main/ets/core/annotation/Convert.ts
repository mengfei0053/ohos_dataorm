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

import { PropertyConverter } from '../converter/PropertyConverter'

export function Convert(v: {
  converter: any,
  columnType: string
}): PropertyDecorator {
  return (target, primaryKey) => {
    let convert = v.converter;
    let convertClass = new convert();
    if (!(convertClass instanceof PropertyConverter)) {
      throw new Error("the @Convert converter must be implements PropertyConverter");
    }
    let prototype = target as any;
    prototype.Columns = prototype.Columns ?? {};
    prototype.Columns[primaryKey] = prototype.Columns[primaryKey] ?? {};
    prototype.Columns[primaryKey].convert = v;
    prototype.Columns[primaryKey].types = v.columnType;
  };
}