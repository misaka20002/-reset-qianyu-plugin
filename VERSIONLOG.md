# 2.0.0

* 对 b 站解析进行整体优化升级
    * 兼容两种 b 站卡片，支持链接解析
    * 解析历史存储本地，可通过#历史 b 站视频查看当前群解析过的视频
    * 支持 b 站 cookie，可以达到用户所能达到的最高画质（4k）
    * 视频过大发送失败时，自动降低画质进行重新解析，直到视频发出，最高可解析 30 分钟的视频（有失败的可能，不建议过长视频的解析）
    * 发现视频文件损坏自动撤回文件

# 2.1.0

* 新增小世界解析
* 新增视频收录（存储为json格式的数据，不用担心空间占用）
    * #收录+目录名称将视频收录到指定名称，如#收录cos
    * #查看收录列表，显示所有的收录列表和数量
    * #创建目录+名称，创建视频目录