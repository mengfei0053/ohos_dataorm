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

import { BaseDao, DaoSession, GlobalContext, OnTableChangedListener, Property, TableAction } from '@ohos/dataorm';
import promptAction from '@ohos.promptAction';
import dataRdb from '@ohos.data.relationalStore';
import { Phone } from './entry/Phone';

const phones = Array<number>(5).fill(0).map((_,index)=>new Phone(index, `OPPO${index}`, 20))
@Entry
@Component
struct InsertPage {
  @State message: string = 'Hello World';
  private daoSession: DaoSession | null = null;
  private phoneDao: BaseDao<Phone, number> | null = null;
  private mPhone: Phone | null = null;

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Text(this.message).fontSize(20)
      Button($r('app.string.Insert_a_data_entry')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addData();
      })
      Button($r('app.string.Update_a_data_entry')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.updateData();
      })
      Button($r('app.string.Query_all_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryData();
      })
      Button($r('app.string.Batch_insert')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addArrayData();
      })
      Button($r('app.string.Delete_OPPO')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.deleteData();
      })
      Button($r('app.string.Batch_insert_or_update')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.updateArrayData();
      })
      Button($r('app.string.Conditional_Query')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryData2();
      })
    }
    .width('100%')
    .height('100%')
  }

  async addArrayData() {
    this.phoneDao?.setEntityUpdateAble(false);
    await this.phoneDao?.insertOrReplaceInTxArrAsync(phones);
  }

  async updateArrayData() {
    let phone1 = new Phone(1, "HUAWEI", 20);
    let phone2 = new Phone(2, "iphone", 20);
    let phone3 = new Phone(3, "XiaoMi", 15);
    let phone4 = new Phone(4, "OPPO", 25);
    let phone5 = new Phone(5, "vivo", 50);
    let phone6 = new Phone(6, "iQOO", 66);

    let array = new Array<Phone>();
    array.push(phone1, phone2, phone3, phone4, phone5, phone6);
    if (this.phoneDao) {
      await this.phoneDao.insertOrReplaceInTxArrAsync(array);
    }
  }

  addData() {
    if (!this.mPhone) {
      this.mPhone = new Phone(1, "OPPO", 10);
    }
    this.phoneDao?.insert(this.mPhone);
  }

  updateData() {
    if (this.mPhone) {
      this.mPhone = new Phone(1, "iphone", 20);
      this.phoneDao?.update(this.mPhone);
    }
  }

  async queryData() {
    if (!this.phoneDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Phone as Record<string, Property>;
    let query = this.phoneDao.queryBuilder().orderAsc(properties.id).buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  async queryData2() {
    if (!this.phoneDao) {
      return;
    }

    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Phone as Record<string, Property>;
    let query1 = this.phoneDao.queryBuilder();
    let query2 = this.phoneDao.queryBuilder();
    let result = this.phoneDao.queryBuilder();

    let condition1 = query1.and(properties.id.eq(1), properties.phonePrice.eq(20), []);
    let condition2 = query2.and(properties.id.eq(1), properties.phoneName.eq("iphone"), []);
    result.or(condition1, condition2, []);

    let a = await result.list();
    this.message = JSON.stringify(a);
  }

  async deleteData() {
    if (!this.phoneDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.Phone as Record<string, Property>;
    let deleteQuery = this.phoneDao.queryBuilder().where(properties.phoneName.eq("OPPO")).buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities();
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.phoneDao = this.daoSession.getBaseDao(Phone);
    this.phoneDao.addTableChangedListener(this.tabListener());
  }

  tabListener(): OnTableChangedListener<dataRdb.ResultSet> {
    return {
      async onTableChanged(t: dataRdb.ResultSet, action: TableAction) {
        if (action === TableAction.INSERT) {
          promptAction.showToast({ message: $r('app.string.Insert_data_success') });
        } else if (action === TableAction.UPDATE) {
          promptAction.showToast({ message: $r('app.string.Update_data_success') });
        } else if (action === TableAction.DELETE) {
          promptAction.showToast({ message: $r('app.string.Delete_data_success') });
        } else if (action === TableAction.QUERY) {
          promptAction.showToast({ message: $r('app.string.Query_data_success') });
        }
      }
    }
  }
}

