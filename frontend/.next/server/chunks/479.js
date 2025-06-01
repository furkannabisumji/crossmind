"use strict";exports.id=479,exports.ids=[479],exports.modules={202:(e,t,r)=>{r.d(t,{Z:()=>o});var a=r(13244);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,a.Z)("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},58788:(e,t,r)=>{r.d(t,{Z:()=>o});var a=r(13244);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,a.Z)("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]])},68975:(e,t,r)=>{r.d(t,{Z:()=>o});var a=r(13244);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,a.Z)("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]])},97214:(e,t,r)=>{r.d(t,{Z:()=>o});var a=r(13244);/**
 * @license lucide-react v0.446.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,a.Z)("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]])},1585:(e,t,r)=>{r.d(t,{f:()=>c});var a=r(47360),o=r(2496),i=r(91331),d="horizontal",l=["horizontal","vertical"],n=a.forwardRef((e,t)=>{let{decorative:r,orientation:a=d,...n}=e,c=l.includes(a)?a:d;return(0,i.jsx)(o.WV.div,{"data-orientation":c,...r?{role:"none"}:{"aria-orientation":"vertical"===c?c:void 0,role:"separator"},...n,ref:t})});n.displayName="Separator";var c=n},12647:(e,t,r)=>{r.d(t,{bU:()=>g,fC:()=>C});var a=r(47360),o=r(31810),i=r(11033),d=r(54654),l=r(46999),n=r(90550),c=r(67862),s=r(2496),p=r(91331),u="Switch",[h,f]=(0,d.b)(u),[y,v]=h(u),k=a.forwardRef((e,t)=>{let{__scopeSwitch:r,name:d,checked:n,defaultChecked:c,required:h,disabled:f,value:v="on",onCheckedChange:k,form:m,...b}=e,[C,g]=a.useState(null),j=(0,i.e)(t,e=>g(e)),Z=a.useRef(!1),S=!C||m||!!C.closest("form"),[z,M]=(0,l.T)({prop:n,defaultProp:c??!1,onChange:k,caller:u});return(0,p.jsxs)(y,{scope:r,checked:z,disabled:f,children:[(0,p.jsx)(s.WV.button,{type:"button",role:"switch","aria-checked":z,"aria-required":h,"data-state":x(z),"data-disabled":f?"":void 0,disabled:f,value:v,...b,ref:j,onClick:(0,o.M)(e.onClick,e=>{M(e=>!e),S&&(Z.current=e.isPropagationStopped(),Z.current||e.stopPropagation())})}),S&&(0,p.jsx)(w,{control:C,bubbles:!Z.current,name:d,value:v,checked:z,required:h,disabled:f,form:m,style:{transform:"translateX(-100%)"}})]})});k.displayName=u;var m="SwitchThumb",b=a.forwardRef((e,t)=>{let{__scopeSwitch:r,...a}=e,o=v(m,r);return(0,p.jsx)(s.WV.span,{"data-state":x(o.checked),"data-disabled":o.disabled?"":void 0,...a,ref:t})});b.displayName=m;var w=a.forwardRef(({__scopeSwitch:e,control:t,checked:r,bubbles:o=!0,...d},l)=>{let s=a.useRef(null),u=(0,i.e)(s,l),h=(0,n.D)(r),f=(0,c.t)(t);return a.useEffect(()=>{let e=s.current;if(!e)return;let t=window.HTMLInputElement.prototype,a=Object.getOwnPropertyDescriptor(t,"checked"),i=a.set;if(h!==r&&i){let t=new Event("click",{bubbles:o});i.call(e,r),e.dispatchEvent(t)}},[h,r,o]),(0,p.jsx)("input",{type:"checkbox","aria-hidden":!0,defaultChecked:r,...d,tabIndex:-1,ref:u,style:{...d.style,...f,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})});function x(e){return e?"checked":"unchecked"}w.displayName="SwitchBubbleInput";var C=k,g=b}};