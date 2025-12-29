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
 * Entity mapped to table "Classes".
 */
import { Columns, ColumnType, Entity, Id, NotNull } from '@ohos/dataorm'

@Entity("CLASSES")
export class Classes {
  @Id()
  @Columns({ columnName: "ID", types: ColumnType.num })
  id: number

  @NotNull()
  @Columns({ columnName: "NAME", types: ColumnType.str })
  name: string

  @Columns({ columnName: "COMMENT", types: ColumnType.str })
  comment: string

  @Columns({ columnName: "TYPE", types: ColumnType.str })
  type: string

  constructor(
    id?: number,
    name?: string,
    comment?: string,
    types?: string,
  ) {
    this.id = id
    this.name = name
    this.comment = comment
    this.type = types
  }


  getId(): number {
    return this.id
  }

  setId(id: number) {
    this.id = id
  }

  getName(): string {
    return this.name
  }

  /** Not-null value; ensure this value is available before it is saved to the database. */
  setName(name: string) {
    this.name = name
  }

  getComment(): string {
    return this.comment
  }

  setComment(comment: string) {
    this.comment = comment
  }

  getType(): string {
    return this.type
  }

  setType(types: string) {
    this.type = types
  }
}
