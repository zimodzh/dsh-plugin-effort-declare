# lib/types/client/

<p align="center">
  <samp>
    <strong>中文</strong> ·
    <a href="./README.en.md">English</a>
  </samp>
</p>

浏览器半区的生成声明，对应 [`src/client/`](../../../src/client/)。

外部包应通过 `dsh-plugin-effort-declare/client` 这一 `exports` 条件引用类型，而不是依赖本目录的相对路径。声明随 `pnpm build` 更新。
