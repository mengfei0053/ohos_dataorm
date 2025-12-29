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

import { BaseDao, DaoSession, GlobalContext } from '@ohos/dataorm';
import { Book } from './entry/Book';
import { Chapter } from './entry/Chapter';
import { Topics } from './entry/Topics';
import { Customer } from './entry/joinProperty/Customer';
import { JoinPropertyUser } from './entry/joinProperty/JoinPropertyUser';

@Entry
@Component
struct CompositePrimaryKey {
  @State message: string = 'Hello World'
  private daoSession: DaoSession | null = null;
  private bookDao: BaseDao<Book, number> | null = null;
  private chapterDao: BaseDao<Chapter, number> | null = null;
  private topicDao: BaseDao<Topics, number> | null = null;
  private customerDao: BaseDao<Customer, number> | null = null;
  private joinPropertyUserDao: BaseDao<JoinPropertyUser, number> | null = null;
  private mUser: JoinPropertyUser | null = null;

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center }) {
      Text(this.message).fontSize(20)
      Button("ADD BookData").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addBookData();
      })
      Button("ADD ChapterData").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addChapterData();
      })
      Button("loadDeep Book data").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.loadDeep();
      })
      Button("loadDeep Chapter data").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.loadChapterDeep()
      })
      Button("joinProperty insert data").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.joinPropertyAddData();
      })
      Button("joinProperty query").fontSize(20).fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.getCustomers()
      })
    }
    .width('100%')
    .height('100%')
  }

  async joinPropertyAddData() {
    this.mUser = new JoinPropertyUser(1, "lid", 1);
    let rowId: number = -1;
    if (this.joinPropertyUserDao) {
      rowId = await this.joinPropertyUserDao.insert(this.mUser);
    }
    let arrays = new Array<Customer>();
    for (let index = 0; index < 5; index++) {
      let customer = new Customer(index, "CustomerName_" + index, rowId);
      arrays[index] = customer;
      if (this.customerDao) {
        await this.customerDao.insert(customer);
      }
    }
  }

  async getCustomers() {
    if (!this.customerDao || !this.mUser || !this.joinPropertyUserDao) {
      return;
    }
    let data = await this.customerDao.queryToManyListByColumnName("customers", [this.mUser.flag + ""]);
    let result = JSON.stringify(data);
    this.message = "查询数据：" + result;
    data.forEach(element => {
      console.info("sss----toMany----" + JSON.stringify(element))
    })
  }

  async addBookData() {
    let book = new Book();
    book.bookId = 100;
    book.bookName = "西游记";
    book.readingChapterUrl = "https:www.baidu.com";
    if (this.bookDao) {
      await this.bookDao.insert(book);
    }
  }

  async addChapterData() {
    let chapter = new Chapter();
    chapter.bookId = 100;
    chapter.content = "三打白骨精急啊去我家阿斯卡我开始喝开水";
    chapter.url = "https:www.baidu.com";
    chapter.name = "三打白骨精"
    if (this.chapterDao) {
      await this.chapterDao.insert(chapter);
    }

    let topics = new Topics();
    topics.bookId = 100;
    topics.questionName = "唐僧是否被吃？";
    topics.chapterUrl = "https:www.baidu.com";
    topics.answer = "NO NO"
    if (this.topicDao) {
      await this.topicDao.insert(topics);
    }
  }

  async loadDeep() {
    if (!this.bookDao) {
      return;
    }
    let book: Book = await this.bookDao.loadDeep(100);
    let result = JSON.stringify(book);
    console.log("sss--->book:" + result);
    this.message = "loadDeep--:" + result;
  }

  async loadChapterDeep() {
    if (!this.chapterDao) {
      return;
    }
    let chapter: Chapter = await this.chapterDao.loadDeep(100);
    let result = JSON.stringify(chapter);
    console.log("sss--->book:" + result);
    this.message = "loadDeep--:" + result;
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.bookDao = this.daoSession.getBaseDao(Book);
    this.chapterDao = this.daoSession.getBaseDao(Chapter);
    this.topicDao = this.daoSession.getBaseDao(Topics)
    this.joinPropertyUserDao = this.daoSession.getBaseDao(JoinPropertyUser);
    this.customerDao = this.daoSession.getBaseDao(Customer)
  }
}