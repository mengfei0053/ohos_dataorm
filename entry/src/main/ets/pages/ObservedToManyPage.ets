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
import { City } from './entry/Observed/City';
import { Province } from './entry/Observed/Province';

@Entry
@Component
struct ObservedToManyPage {
  @State message: string | Resource = $r('app.string.show_sqlite_data');
  @State newData: Province = new Province();
  private daoSession: DaoSession | null = null;
  private cityDao: BaseDao<City, number> | null = null;
  private provinceDao: BaseDao<Province, number> | null = null;

  build() {
    Column() {
      Text(this.message)
      Text(this.newData.province).margin({top:50})
      Button($r('app.string.click_parent'))
        .onClick(() => {
          this.newData.province = "parent component change";
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
      customComponent({parent:this.newData})
    }
    .height('100%')
    .width('100%')
  }

  async addData() {
    let city = new City(1,"hangzhou","mou mou","zhejiang");
    let city1 = new City(2,"ningbo","mou mou1","zhejiang");
    let city2 = new City(3,"shanghai","mou mou2","shanghai");
    let city3 = new City(4,"wuhan","mou mou3","hubei");
    let city4 = new City(5,"beijing","mou mou4","beijing");
    let citys = [city,city1,city2,city3,city4]
    citys.forEach((v,i)=>{
      if (this.cityDao) {
        this.cityDao.insert(v);
      }
    })
    this.newData= new Province(1,"zhejiang",citys);
    if (this.provinceDao) {
       this.provinceDao.insert(this.newData);
    }
  }

  updateData() {
    if (this.newData) {
      this.newData.citys.forEach((v,i)=>{
        v.cityName = "updateName_"+i;
        if (this.cityDao) {
          this.cityDao.updateAsync(v);
        }
      })
      this.newData.province = 'hubei'
      if (this.provinceDao) {
        this.provinceDao.updateAsync(this.newData);
      }
    }
  }

  async deleteData() {
    if (!this.provinceDao||!this.cityDao) {
      return;
    }
    this.provinceDao.deleteAllAsync();
    this.cityDao.deleteAllAsync();
  }

  async queryData() {
    if (!this.provinceDao||!this.cityDao) {
      return;
    }
    let data = await this.cityDao.queryToManyListByColumnName("citys", [this.newData.province]);
    this.message = JSON.stringify(data);
  }

  aboutToAppear() {
    this.daoSession = GlobalContext.getContext().getValue("daoSession") as DaoSession;
    this.provinceDao = this.daoSession.getBaseDao(Province);
    this.cityDao = this.daoSession.getBaseDao(City);
    this.newData.citys = [new City()];
  }
}

@Component
struct customComponent {
  @ObjectLink parent: Province;

  build() {
    Column() {
      Text(this.parent.province)
      Button($r('app.string.click_child')).onClick((ev)=>{
        this.parent.province = "child component change"
      })
    }.margin({top:20})
  }
}