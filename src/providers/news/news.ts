import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

/*
  Generated class for the NewsProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NewsProvider {
  constructor(public http: HttpClient, public sanitizer: DomSanitizer) {
    console.log("Hello NewsProvider Provider");
  }

  getNewsList() {
    return [
      {
        title: "随身的数字资产保险箱 “IFMChain”正式上线",
        type: "simple-html",
        author: "新浪深圳",
        publish_time: "2018-01-19",
        cover_image_url:
          "https://n.sinaimg.cn/shenzhen/transform/w550h308/20180119/HOD--fyqtwzu8386417.png",
        contents: [
          {
            type: "blockquote",
            content:
              "**摘要：** 2018年1月16日，全球第一款接入移动网络的3.0公有链产品--“IFMChain”正式上线，IFMChain是由“本能区块链实验室”研发，Instinct Blockchain Technology （ Malta） Limited发布的。",
          },
          {
            type: "p",
            content:
              "2018年1月16日，全球第一款接入移动网络的3.0公有链产品--“IFMChain”正式上线，IFMChain是由“本能区块链实验室”研发，Instinct Blockchain Technology （ Malta） Limited发布的。",
          },
          {
            type: "image",
            content:
              "https://n.sinaimg.cn/shenzhen/transform/w550h308/20180119/HOD--fyqtwzu8386417.png",
          },
          {
            type: "p",
            content:
              "会议中本能区块链实验室创始人兼CEO杨税令先生面向世界区块链爱好者，解答了“区块链技术发展了9年，为什么没有形成我们通用的信用基础设施？”的疑问。因为“当前落地的区块链，几乎都只能在PC端或服务端运行，虽然有些有轻钱包，一定程度的解决了移动端数据查询及交易签名的问题，但是移动端并不能参与到区块链的共识机制中，不能参与共识机制将不拥有区块链的治理权，并将丧失保障区块链数据可靠性的基本能力！”。针对另外一个一直困扰大家的问题——“为什么以前没有人成功开发移动区块链技术？”，杨税令也从技术、人才等几个角度，进行了说明。",
          },
          {
            type: "image",
            content:
              "https://n.sinaimg.cn/shenzhen/transform/w550h308/20180119/d1k0-fyqtwzu8387418.png",
          },
          {
            type: "p",
            content:
              "随后，著名天使投资人、本能区块链实验室创始发起人刘庆县先生对区块链的未来做了展望。刘庆县先生提到“要完成区块链基础设施的建设是一个伟大任务，需要社会方方面面的参与。我们本能区块链实验室有一份无比包容的胸怀，希望能和全世界的有志之士，共同建设这个基础设施。”",
          },
          {
            type: "image",
            content:
              "https://n.sinaimg.cn/shenzhen/transform/w550h310/20180119/7ECe-fyqtwzu8388681.png",
          },
          {
            type: "p",
            content:
              "中国数字资产交易网的杜海洋先生，也表示，数字资产是未来人类最重要的财富形式，中国数字资产交易网愿意在未来在数字资产交易网当中，推广、使用基于“IFMChain”公有的技术应用。为打造基于区块链的基础设施服务，为推进信用社会进程出一份力。",
          },
          {
            type: "p",
            content:
              "来自东京的日本区块链培训机构的负责人森俊哉先生，也表达了想在日本对“IFMChain”进行更大范围的推广的意愿。80后的日裔华尔街银行家中野慎之，一直对新生事物保持高度关注，在会上也对IFMChain表示高度认同，并诚致邀请本能区块链实验室的两位创始人和技术团队，能在未来访问华尔街，把基于移动区块链技术的“IFMChain”，分享给世界。",
          },
          {
            type: "p",
            content:
              "来自北京 CIO时代学院院长的姚乐博士，对区块链未来的发展作了充分地展望，并认为“IFMChain”将区块链延伸到移动端，是一个创举。",
          },
          {
            type: "p",
            content:
              "会后刘庆县在接受采访时也表示，“IFMChain”是随身的数字资产保险箱。未来会逐渐开源代码，将其打造成信用新时代的基础设施。",
          },
        ],
      },
      {
        title:
          "区块链应用 | 推出支持移动端的公有链IFMChain，「本能」认为移动是区块链的未来",
        author: "36氪",
        public_time: "2018-01-25",
        type: "simple-html",
        cover_image_url:
          "https://pic.36krcnd.com/avatar/201801/21031740/8xp289eqwpczi5jo.jpg!1200",
        contents: [
          {
            type: "image",
            content:
              "https://pic.36krcnd.com/avatar/201801/21031740/8xp289eqwpczi5jo.jpg!1200",
          },
          {
            type: "p",
            content:
              "Bitcoin可以说是最典型的公有链，从它身上可以看出不少底层区块链技术存在的问题。",
          },
          {
            type: "p",
            content:
              "“在中本聪设计Bitcoin之时，是依据9年前当时的硬件基础和软件代码来设计的，9年过去了Bitcoin的系统已经无法满足当下的移动网络的需求，特别突出的问题是交易确认速度过慢，每秒实际确认交易2笔左右，占用空间过大，POW的共识机制导致资源过度浪费，单通道通信方法更是注定了无法接入移动端。”本能区块链实验室创始人兼CEO杨税令如此认为。",
          },
          {
            type: "p",
            content:
              "从Bitcoin的例子，我们大概能理解，手机基本上很难接入传统的公有链。因为其存储空间、计算能力难以支持。36氪最近接触的“本能区块链实验室”，就在最近正式发布了其第一款移动网络公有链产品“IFMChain”。",
          },
          {
            type: "p",
            content:
              "这条链的特色在于可以让移动设备作为节点接入公有链。杨税令表示，“当前落地的区块链，几乎都只能在PC端或服务端运行，虽然有些有轻钱包，一定程度的解决了移动端数据查询及交易签名的问题，但是移动端并不能参与到区块链的共识机制中，不能参与共识机制将不拥有区块链的治理权。”",
          },
          {
            type: "p",
            content:
              "他解释，之前移动设备难以接入公有链，主要受制于三点：存储空间、计算能力与网络可靠性。传统区块链中由于验证数据需要完整的全量数据和最新的未确认交易，所以需要节点存储全量数据和保持实时在线，以保证能获取最新的交易情况，但是移动端的设备并不能保证一直在线，网络随时随地可能会关掉。",
          },
          {
            type: "p",
            content:
              "IFMChain使用的方式是将数据分成两种，一种是完整的区块数据以及区块哈希树，一种是关键检查点，后者是某个时间点的权益（权益持有量）汇总，可以理解为镜像快照。移动设备只需要存储后者，在区块链中充当服务节点；负责完整数据中转和处理的节点则被称为实时节点。即IFMChain中，节点分成两种类型。实时节点是高性能网络节点；服务节点则使用较少的计算和存储资源，并提供完整的事务处理能力。",
          },
          {
            type: "image",
            content:
              "https://pic.36krcnd.com/avatar/201801/22153958/4u5hojlquoupj5kn.png!1200",
          },
          {
            type: "p",
            content:
              "在共识机制方面，目前最常见的是PoW（Proof of Work，工作量证明机制）和PoS（Proof of Stake，权益证明机制），以及超级账本使用的FBPT（拜占庭容错机制）。在具体商业场景中，共识机制需要激励节点工作，IFMChain认为，PoW会造成资源浪费；PoS导致强者越强；FBPT则是所有节点的共识投票权一样，让业务属性减弱。此外，FBPT被认为不适用于公有链。",
          },
          {
            type: "p",
            content:
              "IFMChain使用的是基于参与度的DPOP（Delegeted Proof of Participation），主要考虑的是用户的历史权益（此前拥有的权益数量）和在线活跃度（包括在线时长、贡献带宽、交易量）。",
          },
          {
            type: "p",
            content:
              "受限于性能和数据完整性，只有实时节点才能参与打块（记账）。记账到一个区块时会有权益奖励，包括区块的新增奖励和包含的交易手续费，两者相加后，其中一半由记账的节点获取，另外一半由委托记账节点的节点获取，这些参与委托的节点中，按参与度分配。在这个机制中，每个节点都可获得权益奖励，实时节点主要依靠打块，服务节点主要依靠为其它节点提供服务，所有节点都有动力为他人提供服务。",
          },
          {
            type: "p",
            content:
              "节点获取到权益奖励后，可以在未来参与共识机制中使用这份权益，节点委托其它节点打块时需要消耗权益，未来建立在区块链上的去中心应用，存储数据到区块链上时，也需要消耗这份权益，这为未来可能的区块链应用开发者，提前为区块链网络提供节点贡献设备提供了动力。",
          },
          {
            type: "p",
            content:
              "目前区块链另一个被诟病的问题是其性能。杨税令认为，这主要是因为其打块机制限制，BTC网络每秒理论峰值可以确认约6.7笔，ETH则是25笔。IFMChain采用动态打块机制，每轮记账57次，速度由入围的57个节点中网络最慢的决定。57个区块产生完毕之后继续下一轮。据IFMChain给出的数据，目前其每秒交易笔数可以达到1000笔。",
          },
          {
            type: "p",
            content:
              "目前，部署在IFMChain上的第一个应用是IBT节点软件，这是“本能”自身开发的一个节点管理软件，同时也是一个去中心的应用，主要用于查看权益、参与共识、贡献网络。用户只要下载该应用，就可以贡献自身的存储空间和计算能力，参与到共识机制中，从而获得权益奖励。移动端设备直接接入的作用在于可以规避第三方服务节点参与而引入的第三方自身的信用风险，比如泄露数据、盗取密码等，同时也可以让大家随时随地、更快地访问数据，实时节点和服务节点充当的角色，有点像云计算的云端服务器和本地服务器。区别在于，未来IBT提供的计算能力、存储空间是去中心化的、由不特定的人群提供；而云计算或者传统IDC机房的服务器是私有的。",
          },
          {
            type: "p",
            content:
              "本能区块链实验室创始发起人刘庆县解释，如果用户使用的是基于IFMChain开发的APP，就是同时在积累参与度。这意味着用户在一边和好友聊天一边在获得奖励，一边看直播、看新闻一边获得奖励。",
          },
          {
            type: "p",
            content:
              "IFMChain认为，基于上述方案，他们的优势在于支持移动网络、交易速度快、人人可获得奖励。IFMChain已于2017年12月28号正式上线，初始由创始团队提供57个节点，上线3天后每个节点的请求峰值达到约27.6万，总请求累积约1573.2万。据本能透露2.0版本将于2月初上线，届时用户可以从IFMChain官网下载APP参与体验。",
          },
          {
            type: "p",
            content:
              "本能区块链实验室团队现在约有25人，以开发团队为主。创始人杨税令曾经担任中国建设银行新一代核心系统架构师、中国金保工程第三代核心系统架构师。",
          },
        ],
      },
      {
        title: "IFMChain移动公有链正式发布",
        author: "腾讯视频",
        type: "video",
        url: this.sanitizer.bypassSecurityTrustUrl(
          "assets/video/IFMChain%E7%A7%BB%E5%8A%A8%E5%85%AC%E6%9C%89%E9%93%BE%E6%AD%A3%E5%BC%8F%E5%8F%91%E5%B8%83.mp4",
        ),
        poster: this.sanitizer.bypassSecurityTrustUrl(
          "assets/video/IFMChain%E7%A7%BB%E5%8A%A8%E5%85%AC%E6%9C%89%E9%93%BE%E6%AD%A3%E5%BC%8F%E5%8F%91%E5%B8%83.png",
        ),
      },
      {
        title: "区块链里程碑IFMChain1月16日正式上线",
        author: "乐透社",
        type: "video",
        url: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/区块链里程碑IFMChain1月16日正式上线.mp4",
        ),
        poster: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/区块链里程碑IFMChain1月16日正式上线.jpg",
        ),
      },
      {
        title: "1月16日IFMChain正式全球上线，标志着区块链3.0时代的开启",
        author: "第一视频",
        type: "video",
        url: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/1月16日IFMChain正式全球上线，标志着区块链3.0时代的开启.mp4",
        ),
        poster: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/1月16日IFMChain正式全球上线，标志着区块链3.0时代的开启.jpg",
        ),
      },
      {
        title: "1月16日IFMChain公有链在澳门正式上线，开启区块链3.0时代",
        author: "新奇视频",
        type: "video",
        url: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/1月16日IFMChain公有链在澳门正式上线，开启区块链3.0时代.mp4",
        ),
        poster: this.sanitizer.bypassSecurityTrustUrl(
          "http://cdn-blnc.gaubee.com/1月16日IFMChain公有链在澳门正式上线，开启区块链3.0时代.jpg",
        ),
      },
      {
        title: "移动区块链元年开启 IFMChain星燿濠江",
        author: "硅谷科技",
        public_time: "2018-01-19",
        type: "simple-html",
        cover_image_url: "http://inews.gtimg.com/newsapp_match/0/2736301665/0",
        contents: [
          {
            type: "p",
            content:
              "1月16日,全球首创的第三代区块链网络——“IFMChain”正式上线，这是全球第一款接入移动网络的3.0公有链产品,更是区块链技术的一次伟大突破，IFMChain由“本能区块链实验室”研发，Instinct Blockchain Technology ( Malta) Limited发布，同时，这标志着我国区块链技术在移动领域已经已处于遥遥领先领先世界地位。",
          },
          {
            type: "image",
            content: "http://inews.gtimg.com/newsapp_match/0/2736301665/0",
          },
          {
            type: "p",
            content:
              "随着IFMChain上线并且全球发布，结束了移动终端不能装入公有链产品的局面，所以这个产品具有划时代的意义，它在宣告中国区块链技术发展走在世界前列的同时，也把区块链行业带入了真正的3.0移动区块链时代。",
          },
          {
            type: "p",
            content:
              "同日，在澳门召开的IFMChain公有链全球发布会，也可以看作是一场区块链技术盛会。参会的除了内地区块链的领军人物代表以外，还有来自包括北美、东南亚、日本、港澳台在内多个国家、地区的区块链研究机构的专家、学者，以及区块链技术的爱好者和开发人员。会议中，与会专家们畅想区块链技术在未来的发展，探索区块链技术潜在的应用方向。",
          },
          {
            type: "image",
            content: "http://inews.gtimg.com/newsapp_match/0/2736301668/0",
          },
          {
            type: "p",
            content:
              "CIO时代学院院长姚乐博士，对IFMChain表示了肯定，同时对区块链未来的发展作了充分地展望。",
          },
          {
            type: "image",
            content: "http://inews.gtimg.com/newsapp_match/0/2736301670/0",
          },
          {
            type: "p",
            content:
              "本能区块链实验室创始人兼CEO杨税令先生表示，作为一个程序员，一个架构师，希望社会当中的人际关系，能像人与电脑一样，简单而纯粹。希望把区块链作为一种基础设施，将其运用在社会生活中的各个环节，从而打造更美好的信用时代。同时，也认为，在寡头垄断的网络科技领域，区块链可能是最后一个新兴创业型公司可以与之平等竞争的领域。",
          },
          {
            type: "image",
            content: "http://inews.gtimg.com/newsapp_match/0/2736301673/0",
          },
          {
            type: "p",
            content:
              "著名天使投资人、本能区块链实验室创始发起人刘庆县先生表示，“区块链没有中心服务器，又是自动运行的，所以，随着区块链的系统和代码不断的升级，系统和代码会越来越完美，而我们使用的这个区块链工具就会越来越完善，人们的生活，工作，责任义务分配也会越来越合理，而我们的整个世界就进入了一个良性的合理社会，区块链就成为了未来社会的基础设施，我们都是这个基础设施的参与者和建设者。”。同时，他认为“IFMChain能够帮助我们大幅的提升效率，节约时间和成本，这样我们只需要少量的时间，就能完成更多的工作和获取更多的回报，IFMChain就帮我们解放了时间，提升了效率，为我们的未来世界带来无限的想象空间！”。",
          },
          {
            type: "image",
            content: "http://inews.gtimg.com/newsapp_match/0/2736301675/0",
          },
          {
            type: "p",
            content:
              "独立经济学家、知名财经作家李意坚认为“区块链代表着未来，但和其他新事物一样，需要有一个过程，即是被更多人们所知晓的过程，也是自身不断完善的过程。”，同时，他谈到了作为媒体从业者，对于新兴事物有四方面的责任：“第一、应该为大家还原新事物的客观本质。 第二、发现新技术存在的不足和缺陷。因为，任何新生事物，都可能有不足。发现不足，弥补缺陷，就可以使其更加完美。第三、就是应该普及新领域的新知识。一个全新的领域，必定有大量的知识需要普及，新知识的普及有利于好的新生事物快速获得应用和推广。第四、就是应该让新兴事物，能够助力新时代经济的健康发展。创造更诚信、安全、有序的商业环境。”。",
          },
          {
            type: "p",
            content:
              "另外，日裔华尔街银行家中野慎之在会上也对IFMChain表示高度认同，并表达了想将华尔街的资源与IFMChain对接，同时进行更深层次合作的良好意愿。来自东京的日本区块链培训机构的负责人森俊哉先生，也表达了想在东京针对IFMChain进行更大范围的推广。",
          },
          {
            type: "p",
            content:
              "会议当中本能区块链实验室的CIO熊睿，对IFMChain的设计思路和技术优势，进行了分享，以及来自印尼的联席CIO尼克分享了如何在IFMChain这个公有链底层系统上进行区块链应用的开发。博得阵阵掌声。",
          },
          {
            type: "p",
            content:
              "当天会议过程紧凑，与会人员探讨踊跃，即为我国能够率先突破移动终端区块链技术的瓶颈而欣喜，也为接下来的发展献计献策。我们也期待接下来，我国能够继续走在区块链这个领域的前沿，也希望更多的研究者们能够提供更多基于区块链的应用，从而打造一个更加诚信良好的商业信用环境。",
          },
        ],
      },
    ];
  }
}
