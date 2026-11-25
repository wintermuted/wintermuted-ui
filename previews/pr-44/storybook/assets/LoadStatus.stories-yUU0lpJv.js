import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t}from"./iframe-D5qbwdCu.js";import{n,t as r}from"./utils-D0n_kN6R.js";import{n as i,t as a}from"./Button-DdS4K9Yz.js";import{n as o,t as s}from"./Tooltip-CaFfp_AC.js";function c({issues:e,warnings:t=[],loading:n=!1,labels:i,renderHelp:o,retryIcon:s,loadingIcon:c,className:u}){if(!e.length&&!n&&!t.length)return null;let d=[...e.map(e=>e.message),...t].join(` `),f=e.length?`error`:`warning`;return(0,l.jsxs)(`span`,{className:r(`wm-load-status`,f===`warning`&&`wm-load-status-warning`,u),onClick:e=>e.stopPropagation(),onKeyDown:e=>e.stopPropagation(),children:[d&&(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(`span`,{role:f===`error`?`alert`:`status`,className:o?`wm-sr-only`:void 0,children:d}),o?.({message:d,tone:f}),e.some(e=>e.retry)&&(0,l.jsx)(a,{size:`sm`,variant:`ghost`,className:`wm-load-status-retry`,"aria-label":i.retry,disabled:n,onClick:t=>{t.preventDefault(),e.forEach(e=>e.retry?.())},children:s??i.retry})]}),n&&!e.length&&(0,l.jsx)(`span`,{role:`status`,"aria-label":i.loading,className:`wm-load-status-loading`,children:c??i.loading})]})}var l;function u(){return(u=e((()=>{n(),i(),l=t(),c.__docgenInfo={description:``,methods:[],displayName:`LoadStatus`,props:{issues:{required:!0,tsType:{name:`unknown`},description:``},warnings:{required:!1,tsType:{name:`unknown`},description:``,defaultValue:{value:`[]`,computed:!1}},loading:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},labels:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{ retry: string; loading: string }`,signature:{properties:[{key:`retry`,value:{name:`string`,required:!0}},{key:`loading`,value:{name:`string`,required:!0}}]}},description:``},renderHelp:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(help: LoadStatusHelp) => React.ReactNode`,signature:{arguments:[{type:{name:`LoadStatusHelp`},name:`help`}],return:{name:`ReactReactNode`,raw:`React.ReactNode`}}},description:``},retryIcon:{required:!1,tsType:{name:`ReactReactNode`,raw:`React.ReactNode`},description:``},loadingIcon:{required:!1,tsType:{name:`ReactReactNode`,raw:`React.ReactNode`},description:``},className:{required:!1,tsType:{name:`string`},description:``}}}})))()}var d,f,p,m,h,g,_,v,y,b,x;function S(){return(S=e((()=>{i(),u(),o(),d=t(),{fn:f}=__STORYBOOK_MODULE_TEST__,p={title:`Components/Feedback/LoadStatus`,id:`components-loadstatus`,component:c,args:{issues:[],warnings:[],loading:!1,labels:{retry:`Retry records`,loading:`Loading records`}},argTypes:{loading:{control:`boolean`},issues:{control:!1},warnings:{control:`object`},labels:{control:`object`},renderHelp:{control:!1},retryIcon:{control:!1},loadingIcon:{control:!1}},parameters:{docs:{description:{component:`Context-free loading, error and warning announcements. The host supplies messages, retries and optional help positioning. Retry does not bubble into surrounding disclosures.`}}}},m={},h={args:{loading:!0}},g={args:{warnings:[`Some records are incomplete.`]}},_={args:{loading:!0,warnings:[`Some records are incomplete.`]}},v={args:{issues:[{message:`Records could not be loaded.`,retry:f()}]}},y={args:{loading:!0,issues:[{message:`Records could not be loaded.`,retry:f()}]}},b={args:{warnings:[`Archived records are excluded.`],renderHelp:({message:e})=>(0,d.jsx)(s,{text:e,children:(0,d.jsx)(a,{variant:`ghost`,"aria-label":`About excluded records`,children:`?`})})}},x=[`Idle`,`Loading`,`Warning`,`LoadingWithWarning`,`ErrorWithRetry`,`Recovering`,`WithHelp`],m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    warnings: ["Some records are incomplete."]
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    warnings: ["Some records are incomplete."]
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    issues: [{
      message: "Records could not be loaded.",
      retry: fn()
    }]
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    issues: [{
      message: "Records could not be loaded.",
      retry: fn()
    }]
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    warnings: ["Archived records are excluded."],
    renderHelp: ({
      message
    }) => <Tooltip text={message}><Button variant="ghost" aria-label="About excluded records">?</Button></Tooltip>
  }
}`,...b.parameters?.docs?.source}}}})))()}S();export{v as ErrorWithRetry,m as Idle,h as Loading,_ as LoadingWithWarning,y as Recovering,g as Warning,b as WithHelp,x as __namedExportsOrder,p as default};