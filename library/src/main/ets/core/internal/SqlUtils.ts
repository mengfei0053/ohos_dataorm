/*
* Copyright (c) 2022 Huawei Device Co., Ltd.
 *
 * Based on SqlUtils.java written by
 * Copyright (C) 2011-2016 Markus Junginger, greenrobot (http://greenrobot.org)
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

import { Property } from '../Property'

export class SqlUtils {
  /**
   * 拼接属性名，带表前缀（如有），返回完整的列名字符串
   * @param builder 初始字符串
   * @param tablePrefix 表前缀
   * @param property 属性对象
   * @returns 拼接后的列名字符串
   */
  public static appendProperty(builder: string, tablePrefix: string, property: Property): string {
    if (tablePrefix) {
      builder = `${builder}${tablePrefix}.`;
    }
    builder = `${builder}${property.columnName}`;

    return builder;
  }

  /**
   * 拼接多列名，带表别名，逗号分隔
   * @param builder 初始字符串
   * @param tableAlias 表别名
   * @param columns 列名数组
   * @returns 拼接后的列名字符串
   */
  public static appendColumns(builder: string, tableAlias: string, columns: string[]): string {
    return builder + columns.map((col) => `${tableAlias}.${col}`).join(",");
  }

  public static appendColumnsWithAlias(builder: string, tableAlias: string, tableName: string, columns: string[]): string {
    return builder + columns.map((col) => `${tableAlias}.${col} as ${tableName}_${col}`).join(",");
  }

  /**
   * 拼接指定数量的占位符（?），逗号分隔
   * @param builder 初始字符串
   * @param count 占位符数量
   * @returns 拼接后的占位符字符串
   */
  public static appendPlaceholders(builder: string, count: number): string {
    return builder + Array.from({ length: count }, () => "?").join(",");
  }

  /**
   * 拼接多列的“列=?”条件，带表别名，逗号分隔
   * @param builder 初始字符串
   * @param tableAlias 表别名
   * @param columns 列名数组
   * @returns 拼接后的“列=?”条件字符串
   */
  public static appendColumnsEqValue(builder: string, tableAlias: string, columns: string[]): string {
    return builder + columns.map(col => `${tableAlias}.${col}=?`).join(',');
  }

  /** 
   * 创建指定列的SELECT语句，带有结尾空格
   * @param tableName 表名
   * @param tableAlias 表别名
   * @param columns 列名数组
   * @param distinct 是否去重
   * @returns SELECT语句字符串
   */
  public static createSqlSelect(tableName: string, tableAlias: string, columns: string[], distinct: boolean): string {
    if (!tableAlias || tableAlias.length === 0) {
      throw new Error("Table alias required");
    }

    const withColumns = this.appendColumns('', tableAlias, columns)
    return `SELECT ${distinct ? "DISTINCT " : ""}${withColumns} FROM ${tableName} ${tableAlias} `;
  }

  public static createDeepSqlSelect(tableName: string, tableAlias: string, columns: string[], distinct: boolean): string {
    if (!tableAlias || tableAlias.length === 0) {
      throw new Error("Table alias required");
    }

    const withColumns = this.appendColumnsWithAlias('', tableAlias, tableName, columns)
    return `SELECT ${distinct ? "DISTINCT " : ""}${withColumns} FROM ${tableName} ${tableAlias} `;
  }

  /** 
   * 创建SELECT COUNT(*)语句，带有结尾空格
   * @param tableName 表名
   * @param tableAliasOrNull 表别名（可选）
   * @returns SELECT COUNT(*)语句字符串
   */
  public static createSqlSelectCountStar(tableName: string, tableAliasOrNull: string): string {
    let builder = `SELECT COUNT(*) FROM "${tableName}" `;
    if (tableAliasOrNull) {
      builder = `${builder}${tableAliasOrNull} `;
    }
    return builder;
  }

  /** 
   * 创建DELETE语句（注意：SQLite不支持DELETE的JOIN和表别名）
   * @param tableName 表名
   * @param columns 条件列名数组
   * @returns DELETE语句字符串
   */
  public static createSqlDelete(tableName: string, columns: string[]): string {
    let builder = `DELETE FROM ${tableName}`;
    if (columns && columns.length > 0) {
      builder = `${builder} WHERE ${this.appendColumnsEqValue(builder, tableName, columns)}`;
    }
    return builder;
  }
}