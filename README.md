## 结构介绍与安装
### 子项目
对于子项目，不使用npm进行安装，而是使用`git add submodule`的方式将源码放置到src目录下，并直接引用子项目中的ts源文件，而不是编译出来的js文件来进行编译。
同时，需要在主项目的package.json中，使用`file:`来声明依赖，这样在`npm install`的时候能将子项目的依赖一并安装到主项目的`node_modules`中。所以子项目内不能进行`npm install`，确保统一使用主项目的`node_modules`，否则很容易照成依赖重复引发冗余代码，以及ts定义文件重复声明报错等问题。

## Table of Contents

2. [Pages](#pages)
3. [Providers](#providers)
4. [i18n](#i18n) (adding languages)

## Git 提交

进行新的任务的时候，`checkout -b`出一个新的分支：`feature/fixbug/release`一般是这三类。完成后合并到`develop`分支，最后上传`develop`分支。具体怎么搞@吴祖贤
在进行正式提交前，建议运行`npm run format:diff`来统一风格格式化那些变动的、新增的文件。
在release的时候，运行`npm run fotmat:all`来格式化所有文件。

## Pages

一共有三个主要界面：欢迎页（教程页面、广告页面、解锁页面）、登录注册页、主界面
一个辅助页面：Iframepage（打开第三方网页时使用）

项目所有页面都采用动态加载的方案。

### 新的页面
创建新的页面时，使用命令行：

```
ionic g page yourPageName
```

然后在`your-page-name.ts`中，将`@IonicPage()`修改为：`@IonicPage({name:your-page-name"})`，统一使用小写+连接号的写法，如：`@IonicPage({ name: "tab-chain" })`

然后引入`bnqkl-framework/SecondLevelPage`：
```ts
import { SecondLevelPage } from "../../bnqkl-framework/SecondLevelPage";
import { TabsPage } from "../tabs/tabs";
export class YourPageName extends SecondLevelPage {
	constructor(public navCtrl: NavController, public navParams: NavParams,public tabs: TabsPage) {
		super(navCtrl, navParams, true, tabs);
	}
```
注意，在添加页面后可能需要重启项目。

再有，一般添加页面是添加二级页面，就如同上面的代码，项目中建议将二级页面进行归类，比如“我的联系人”页面：`account-my-contacts`，使用`account`开头，命名上对应`tab-account`的子页面，并且将这个页面转移到`pages/account`文件夹下。只有一些通用的页面，则是归类到`pages/common`中。

### 页面的跳转与拦截

在基于`SecondLevelPage`与`FirstLevelPage`的页面中，跳转统一使用`.routeTo(page_name)`来进行跳转，有的页面在进入前需要做一些判断，这类页面的拦截统一写在`FLP_Route.ts`中，使用`.registerRouteToBeforeCheck`进行注册拦截器。

### 页面的任务

有的页面是用来完成一些任务的，比如表单的提交，在这类页面执行完成完任务后，需要统一执行一次`.finishJob()`，来告知与其关联的页面自己的任务已经完成。

### 生命周期

使用`@YourPageName.willEnter/didEnter/willLeval/didLeval/onInit/onDestory`这些修饰器来修饰函数，从而赋予这些函数在对应的时间段自动执行的行为。

### 异步任务

建议使用async/await来描述，除非是简单的调度接口，然后使用`asyncCtrlGenerator.loading/error/success`来修饰这些返回Promise的方法。

## Api

所有请求都基于`providers/app-fetch`，对于频繁请求并且可以缓存的数据，使用`TB_AB_Generator(Token Base AsyncBehaviorSubjuet Generator)`基于用户登录Token的异步缓存生成器 来生成可缓存。

对于处理网络异常时，保证页面不为空的时候，可以用`.fetch.autoCatch(true).get/post`来强制缓存请求的数据，从而在网络异常的时候，能使用最近一次缓存数据进行显示（会伴随错误提示，如果有使用`@asyncCtrlGenerator.error`进行错误捕捉）。

## i18n

Ionic Super Starter comes with internationalization (i18n) out of the box with
[ngx-translate](https://github.com/ngx-translate/core). This makes it easy to
change the text used in the app by modifying only one file. 

### Adding Languages

To add new languages, add new files to the `src/assets/i18n` directory,
following the pattern of LANGCODE.json where LANGCODE is the language/locale
code (ex: en/gb/de/es/etc.).

### Changing the Language

To change the language of the app, edit `src/app/app.component.ts` and modify
`translate.use('en')` to use the LANGCODE from `src/assets/i18n/`
