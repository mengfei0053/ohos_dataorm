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

import { BaseDao, DaoSession, GlobalContext, Property } from '@ohos/dataorm';
import { SingleObserved } from './entry/Observed/SingleObserved';

@Entry
@Component
struct ObservedAndDataSecPage {
  @State message: string | Resource = $r('app.string.show_sqlite_data');
  @State newData: SingleObserved = new SingleObserved(false, 1, "co", "px");
  private daoSession: DaoSession | null = null;
  private singleDao: BaseDao<SingleObserved, number> | null = null;

  build() {
    Column() {
      Text(this.message)
      Button($r('app.string.Add_nested_data')).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addData();
      })
      Button($r('app.string.Update_nested_data')).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.updateData();
      })
      Button($r('app.string.Query_nested_data')).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryData();
      })
      Button($r('app.string.Delete_nested_data')).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.deleteData();
      })

    }
    .height('100%')
    .width('100%')
  }

  addData() {
    this.newData = new SingleObserved(true, 11, "coA", "pxA");
    if (this.singleDao) {
      this.singleDao.insert(this.newData);
    }
  }

  updateData() {
    if (this.newData) {
      this.newData = new SingleObserved(true, 11, "coU", "pxU");
      if (this.singleDao) {
        this.singleDao.updateAsync(this.newData)
      }
    }
  }

  async deleteData() {
    if (!this.singleDao) {
      return;
    }
    this.singleDao.deleteAllAsync();
  }

  async queryData() {
    if (!this.singleDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.SingleObserved as Record<string, Property>;
    let query = this.singleDao.queryBuilder().orderAsc(properties.pls).buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.singleDao = this.daoSession.getBaseDao(SingleObserved);
  }
}