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

import { BaseDao, DaoSession, GlobalContext } from '@ohos/dataorm';
import { ToOneBook } from './entry/Observed/ToOneBook';
import { ToOneChapter } from './entry/Observed/ToOneChapter';

@Entry
@Component
struct ObservedToOnePage {
  @State message: string = 'Hello World';
  private daoSession: DaoSession | null = null;
  private bookDao: BaseDao<ToOneBook, number> | null = null;
  private chapterDao: BaseDao<ToOneChapter, number> | null = null;

  build() {
    Column() {
      Text(this.message)
      Button("ADD BookData").fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addBookData();
      })
      Button("ADD ChapterData").fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.addChapterData();
      })
      Button("loadDeep Book data").fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.loadDeep();
      })
      Button("loadDeep Chapter data").fontWeight(FontWeight.Bold).margin({ top: 20 }).onClick(() => {
        this.loadChapterDeep()
      })
    }
    .height('100%')
    .width('100%')
  }

  async addBookData() {
    let book = new ToOneBook();
    book.bookId = 100;
    book.bookName = "西游记";
    book.readingChapterUrl = "https:www.baidu.com";
    if (this.bookDao) {
      await this.bookDao.insert(book);
    }
  }

  async addChapterData() {
    let chapter = new ToOneChapter();
    chapter.bookId = 100;
    chapter.content = "三打白骨精急啊去我家阿斯卡我开始喝开水";
    chapter.url = "https:www.baidu.com";
    chapter.name = "三打白骨精"
    if (this.chapterDao) {
      await this.chapterDao.insert(chapter);
    }

  }

  async loadDeep() {
    if (!this.bookDao) {
      return;
    }
    let book: ToOneBook = await this.bookDao.loadDeep(100);
    let result = JSON.stringify(book);
    console.log("sss--->book:" + result);
    this.message = "loadDeep--:" + result;
  }

  async loadChapterDeep() {
    if (!this.chapterDao) {
      return;
    }
    let chapter: ToOneChapter = await this.chapterDao.loadDeep(100);
    let result = JSON.stringify(chapter);
    console.log("sss--->book:" + result);
    this.message = "loadDeep--:" + result;
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.bookDao = this.daoSession.getBaseDao(ToOneBook);
    this.chapterDao = this.daoSession.getBaseDao(ToOneChapter);
  }
}