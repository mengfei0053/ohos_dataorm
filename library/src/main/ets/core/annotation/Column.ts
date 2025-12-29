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

import { ColumnType } from '../ColumnType';
import { PropertyConverter } from '../converter/PropertyConverter';
import { JoinPropertyEntity } from './ToMany';

export function Columns(v: {
  columnName?: string,
  types?: string,
}): PropertyDecorator {
  return (target, primaryKey) => {
    let prototype = target as any;
    prototype.Columns = prototype.Columns ?? {};
    prototype.Columns[primaryKey] = prototype.Columns[primaryKey] ?? {};
    prototype.Columns[primaryKey].columnName = v.columnName;
    prototype.Columns[primaryKey].types = v.types;
    switch (v.types){
      case ColumnType.num:
        prototype.Columns[primaryKey].typeValue = ColumnType.numValue;
        break;
      case ColumnType.str:
        prototype.Columns[primaryKey].typeValue = ColumnType.strValue;
        break;
      case ColumnType.blob:
        prototype.Columns[primaryKey].typeValue = ColumnType.blobValue;
        break;
      case ColumnType.real:
        prototype.Columns[primaryKey].typeValue = ColumnType.realValue;
        break;
      default:
    }
  };
}