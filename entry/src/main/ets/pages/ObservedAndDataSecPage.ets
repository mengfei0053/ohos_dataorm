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
import { ChildObsSec } from './entry/Observed/ChildObsSec';
import { ParentObsSec } from './entry/Observed/ParentObsSec';


@Entry
@Component
struct ObservedAndDataSecPage {
  @State message: string | Resource = $r('app.string.show_sqlite_data');
  @State newData: ParentObsSec = new ParentObsSec(new ChildObsSec('parent init data', "908"), 1, "abs");
  private daoSession: DaoSession | null = null;
  private parentDao: BaseDao<ParentObsSec, number> | null = null;

  build() {
    Column() {
      Text(this.message)
      Text(this.newData.child.name).margin({ top: 50 })
      Button($r('app.string.click_parent'))
        .onClick(() => {
          this.newData.child = new ChildObsSec('parent component change name', "1111");
        })
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
      Text($r('app.string.show_child_area')).margin({top:20})
      customComponent({ parent: this.newData })
    }
    .height('100%')
    .width('100%')
  }

  addData() {
    this.newData.userName = "addData_userName"
    this.newData.child = new ChildObsSec('数据库nameAdd', "addData");
    if (this.parentDao) {
      this.parentDao.insert(this.newData);
    }
  }

  updateData() {
    if (this.newData) {
      this.newData.userName = "updateData_userName"
      this.newData.child = new ChildObsSec('数据库name update', "updateData");
      if (this.parentDao) {
        this.parentDao.updateAsync(this.newData)
      }
    }
  }

  async deleteData() {
    if (!this.parentDao) {
      return;
    }
    this.parentDao.deleteAllAsync();
  }

  async queryData() {
    if (!this.parentDao) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ParentObsSec as Record<string, Property>;
    let query = this.parentDao.queryBuilder().orderAsc(properties.userName).buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.parentDao = this.daoSession.getBaseDao(ParentObsSec);
  }
}

@Component
struct customComponent {
  index: number = 0;
  @ObjectLink parent: ParentObsSec;

  build() {
    Column() {
      Text(this.parent.child.name)
      Button($r('app.string.click_child')).onClick((ev) => {
        this.index++;
        this.parent.child = new ChildObsSec("child component change：" + this.index, "2222" + this.index);
      })
    }.margin({ top: 20 })
  }
}