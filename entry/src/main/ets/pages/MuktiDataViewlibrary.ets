/*
  * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { BaseDao,
  DaoMaster,
  DaoSession,
  Database,
  GlobalContext,
  OnTableChangedListener,
  Property,
  TableAction
} from '@ohos/dataorm';
import dataRdb from '@ohos.data.relationalStore';
import promptAction from '@ohos.promptAction';
import { ConvertInfo } from './convert/ConvertInfo';
import ArrayList from '@ohos.util.ArrayList';
import { ExampleOpenHelper } from './ExampleOpenHelper';
import { ExampleOpenHelper2 } from './ExampleOpenHelper2';
import { Note } from './Note';
import { JoinManyToDateEntity } from './JoinManyToDateEntity';
import { Teacher } from './Teacher';
import { DateEntity } from './DateEntity';
import { Book } from './entry/Book';
import { Student } from './Student';
import { Chapter } from './entry/Chapter';
import { Topics } from './entry/Topics';
import { User } from './embed/User';
import { CreateInDBInfo } from './embed/CreateInDBInfo';
import { JoinPropertyUser } from './entry/joinProperty/JoinPropertyUser';
import { Customer } from './entry/joinProperty/Customer';
import { OnePlus } from './entry/OnePlus';

@Entry
@Component
struct MukitiDataViewLibrary {
  context: Context | undefined;
  scroller: Scroller = new Scroller();
  @State dirArr: Array<string> = [];
  @State arr: Array<string> = new Array<string>();
  @State text: string = '';
  private daoSession1: DaoSession | null = null;
  private noteDao1: BaseDao<ConvertInfo, number> | null = null;
  private daoSession2: DaoSession | null = null;
  private noteDao2: BaseDao<ConvertInfo, number> | null = null;
  @State message: string = 'Hello World';
  @State message2: string = 'Hello World';
  private mConvertInfo1: ConvertInfo | null = null;
  private mConvertInfo2: ConvertInfo | null = null;

  getResourceString(res:Resource){
    return getContext().resourceManager.getStringSync(res.id)
  }

  async createDataBase() {
    this.daoSession1 = GlobalContext.getContext().getValue("daoSession2") as DaoSession;
    this.noteDao1 = this.daoSession1.getBaseDao(ConvertInfo);
    this.noteDao1.addTableChangedListener(this.tabListener());
    promptAction.showToast({ message: "数据库1 成功" });
  }

  async createDataBase2() {
    this.daoSession2 = GlobalContext.getContext().getValue("daoSession3") as DaoSession;
    this.noteDao2 = this.daoSession2.getBaseDao(ConvertInfo);
    this.noteDao2.addTableChangedListener(this.tabListener());
    promptAction.showToast({ message: "数据库2 成功" });
  }

  build() {
    Flex({ direction: FlexDirection.Column,
      alignItems: ItemAlign.Center,
      justifyContent: FlexAlign.Center }) {
      Button(this.getResourceString($r('app.string.Create_DB')) + '1')
        .fontSize(20)
        .margin({ top: 10 })
        .fontWeight(FontWeight.Bold)
        .onClick(() => {
          this.createDataBase()
        })
        .height('100')
      Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
        Text(this.message).fontSize(20)
        Button($r('app.string.Insert_DB1')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.addData1();
        })
        Button($r('app.string.Update_DB1')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.updateData1();
        })
        Button($r('app.string.Query_DB1')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.queryData1();
        })
        Button($r('app.string.Delete_DB1')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.deleteData1();
        })
      }
      .width('100%')
      .height('100%')
      Button(this.getResourceString($r('app.string.Create_DB')) + '2')
        .fontSize(20)
        .margin({ top: 10 })
        .fontWeight(FontWeight.Bold)
        .onClick(() => {
          this.createDataBase2()
        })
        .height('100')
      Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
        Text(this.message2).fontSize(20)
        Button($r('app.string.Insert_DB2')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.addData2();
        })
        Button($r('app.string.Update_DB2')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.updateData2();
        })
        Button($r('app.string.Query_DB2')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.queryData2();
        })
        Button($r('app.string.Delete_DB2')).fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 10 }).onClick(() => {
          this.deleteData2();
        })
      }
      .width('100%')
      .height('100%')
    }
    .width('100%')
    .height('100%')
  }

  // 第一个数据库
  addData1() {
    if (!this.mConvertInfo1) {
      this.mConvertInfo1 = new ConvertInfo();
    }
    let images = new ArrayList<string>();
    images.add("image1");
    images.add("image2");
    this.mConvertInfo1.images = images;
    if (this.noteDao1) {
      this.noteDao1.insert(this.mConvertInfo1);
    }
  }

  updateData1() {
    if (this.mConvertInfo1) {
      let images = new ArrayList<string>();
      images.add("update1");
      images.add("update2");
      this.mConvertInfo1.images = images;
      if (this.noteDao1) {
        this.noteDao1.update(this.mConvertInfo1)
      }
    }
  }

  async queryData1() {
    if (!this.noteDao1) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let query = this.noteDao1.queryBuilder().orderAsc(properties.images).buildCursor();
    let a = await query.list();
    this.message = JSON.stringify(a);
  }

  async deleteData1() {
    if (!this.noteDao1) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let deleteQuery = this.noteDao1.queryBuilder().where(properties.id.eq(1))
      .buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities();
  }


  // 第二个数据库
  addData2() {
    if (!this.mConvertInfo2) {
      this.mConvertInfo2 = new ConvertInfo();
    }
    let images = new ArrayList<string>();
    images.add("image1");
    images.add("image2");
    this.mConvertInfo2.images = images;
    if (this.noteDao2) {
      this.noteDao2.insert(this.mConvertInfo2);
    }
  }

  updateData2() {
    if (this.mConvertInfo2) {
      let images = new ArrayList<string>();
      images.add("update1");
      images.add("update2");
      this.mConvertInfo2.images = images;
      if (this.noteDao2) {
        this.noteDao2.update(this.mConvertInfo2)
      }
    }
  }

  async queryData2() {
    if (!this.noteDao2) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let query = this.noteDao2.queryBuilder().orderAsc(properties.images).buildCursor();
    let a = await query.list();
    this.message2 = JSON.stringify(a);
  }

  async deleteData2() {
    if (!this.noteDao2) {
      return;
    }
    let entityClass = GlobalContext.getContext().getValue(GlobalContext.KEY_CLS) as Record<string, Object>;
    let properties = entityClass.ConvertInfo as Record<string, Property>;
    let deleteQuery = this.noteDao2.queryBuilder().where(properties.id.eq(1))
      .buildDelete();
    deleteQuery.executeDeleteWithoutDetachingEntities();
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


  async aboutToAppear() {
    this.context = GlobalContext.getContext().getValue(GlobalContext.KEY_CTX) as Context;
    // regular SQLite database
    let helper: ExampleOpenHelper =  new ExampleOpenHelper(this.context, "notes2.db", "customDir");
    let helper2: ExampleOpenHelper = new ExampleOpenHelper2(this.context, "notes3.db");
    // 将所有的表(新增,修改,已存在)加到全局
    helper.setEntities(Note, Teacher, JoinManyToDateEntity, DateEntity, Book, Student ,
      Chapter, Topics, User, ConvertInfo, CreateInDBInfo, JoinPropertyUser, Customer, OnePlus);
    helper2.setEntities(Note, Teacher, JoinManyToDateEntity, DateEntity, Book, Student ,
      Chapter, Topics, User, ConvertInfo, CreateInDBInfo, JoinPropertyUser, Customer, OnePlus);
    // 将所有表更新实例放到ExampleOpenHelper的父级中
    let db: Database = await helper.getWritableDb();
    let db2: Database = await helper2.getWritableDb();
    db.name = "notes2.db";
    db.customDir = "customDir";
    db2.name = "notes3.db";
    GlobalContext.getContext().setValue("daoSession2", new DaoMaster(db).newSession());
    GlobalContext.getContext().setValue("daoSession3", new DaoMaster(db2).newSession());

  }

}