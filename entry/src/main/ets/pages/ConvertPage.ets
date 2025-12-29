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
import { ConvertInfo } from './convert/ConvertInfo';
import dataRdb from '@ohos.data.relationalStore';
import ArrayList from '@ohos.util.ArrayList';

@Entry
@Component
struct ConvertPage {
  @State message: string = 'Hello World';
  private daoSession: DaoSession | null = null;
  private covertDao: BaseDao<ConvertInfo, number> | null = null;
  private mConvertInfo: ConvertInfo | null = null;

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Text(this.message).fontSize(20)
      Button($r('app.string.Insert_Convert_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addData();
      })
      Button($r('app.string.Update_Convert_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.updateData();
      })
      Button($r('app.string.Query_Convert_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.queryData();
      })
      Button($r('app.string.Delete_data')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.deleteData();
      })
    }
    .width('100%')
    .height('100%')
  }

  addData() {
    if (!this.mConvertInfo) {
      this.mConvertInfo = new ConvertInfo();
    }
    let images = new ArrayList<string>();
    images.add("image1");
    images.add("image2");
    images.add("image3");
    images.add("image4");
    images.add("image5");
    images.add("image6");

    this.mConvertInfo.images = images;
    if (this.covertDao) {
      this.covertDao.insert(this.mConvertInfo);
    }
  }

  updateData() {
    if (this.mConvertInfo) {
      let images = new ArrayList<string>();
      images.add("update1");
      images.add("update2");
      images.add("update3");
      images.add("update4");
      images.add("update5");
      images.add("update6");

      this.mConvertInfo.images = images;
      if (this.covertDao) {
        this.covertDao.update(this.mConvertInfo);
      }
    }
  }

  async queryData() {
    if (!this.covertDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let query = this.covertDao.queryBuilder().orderAsc(properties.images).buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  async deleteData() {
    if (!this.covertDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let deleteQuery = this.covertDao.queryBuilder().where(properties.id.eq(1))
      .buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities();
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.covertDao = this.daoSession.getBaseDao(ConvertInfo);
    this.covertDao.addTableChangedListener(this.tabListener());
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

