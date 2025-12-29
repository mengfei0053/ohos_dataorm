/*
  * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Property } from "../Property";
import { JoinPropertyEntity } from "./ToMany";

export interface IColumn {
  columnName?: string; //列名
  types?: string; //列类型
  typeValue?: string; //列类型
  isPrimaryKey?: boolean; //是否主键
  autoincrement?: boolean; //是否自增
  notNull?: boolean; //是否非空
  unique?: boolean; //是否唯一
  isUnionPrimaryKey?: boolean; //是否联合主键
  // convert?:PropertyConverter<any,any>
  embedded?: {
    prefix: string,
    targetClass: any
  }
  indexUnique?: boolean
  indexName?: string
  joinEntity?: {
    entityName: string
    targetClsName: string
    sourceProperty: string,
    targetProperty: string
  }
  orderBy?: string
  toMany?: {
    targetClsName: string,
    joinProperty: Array<JoinPropertyEntity>
  }
  toOne?: {
    joinProperty: string,
    targetObj: any
  }
  convert?: {
    converter: any,
    columnType: string
  }
  transient?: string
}

export interface ITable {
  tableName?: string; //表名
  createInDb?: boolean; //创建数据库时是否创建该表
  entityClass?: string; //类名称
  indexes?: Array<{ //索引
    name?: string,
    value: string,
    unique: boolean
  }>
}

type ColumnTT = Required<Omit<IColumn, 'isPrimaryKey' | 'autoincrement'>>;

export namespace RdbConst {
  export const TABLE: string = 'TABLE'

  export const COLUMN: string = 'Column'

  export const EMBEDDED: string = 'Embedded'
}

export function getClsTableInfo(cls: any) {
  return cls.prototype.Table as ITable
}

export function getClsPropertiesArray(cls:any){
  return cls.prototype.PropertiesArray as Array<Property>
}

export function getClsColumns(cls: any, name: string) {
  let col = cls.prototype.Columns[name] as IColumn;
  return col ?? {}as IColumn;
}

export function getClsColumn(cls: any) {
  return cls.prototype.Columns
}
