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

import { BaseDao, DaoSession, GlobalContext, Property } from '@ohos/dataorm';
import { People } from './entry/People';

const TAG = 'UnionPrimaryKey';

@Entry
@Component
struct UnionPrimaryKey {
  @State message: string = '{}';
  private daoSession: DaoSession | null = null;
  private dao: BaseDao<People, number> | null = null;

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Text(this.message).fontSize(20)
      Button("add").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addData();
      })
      Button("delete").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.deleteData();
      })
      Button("select").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.selectData();
      })
      Button("refresh").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.refreshData();
      })
    }
    .width('100%')
    .height('100%')
  }

  async addData() {
    let arrays = new Array<People>();
    arrays.push(new People('A', 'A', 20));
    arrays.push(new People('A', 'B', 20));
    arrays.push(new People('A', 'C', 20));
    arrays.push(new People('B', 'A', 20));
    arrays.push(new People('B', 'B', 20));
    arrays.push(new People('B', 'C', 20));
    arrays.push(new People('C', 'A', 20));
    arrays.push(new People('C', 'B', 20));
    arrays.push(new People('C', 'C', 20));
    arrays.push(new People('A', 'A', 18));
    arrays.push(new People('B', 'B', 18));
    arrays.push(new People('C', 'C', 18));
    console.info(TAG, 'addData start this.dao:' + this.dao);
    if (this.dao) {
      for (let i = 0; i < arrays.length; i++) {
        const id = await this.dao.insert(arrays[i]);
        console.info(TAG, 'addData index:' + i + ',id:' + id);
      }
    }
  }

  async deleteData() {
    if (!this.dao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.People as Record<string, Property>;
    let deleteQuery = this.dao.queryBuilder().where(properties.firstName.eq("C"))
      .buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities();
  }

  async selectData() {
    if (!this.dao) {
      return;
    }
    let query = this.dao.queryBuilder().buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  async refreshData() {
    if (!this.dao) {
      return;
    }
    this.dao?.deleteAllAsync();
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.dao = this.daoSession.getBaseDao(People);
  }
}