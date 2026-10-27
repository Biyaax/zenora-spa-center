import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Modal, ToastProvider } from './UI';
import '../../styles/manager-redesign.css';

const menu = [
  ['/manager/dashboard','Dashboard','fa-home'],
  ['/manager/services','Services & Packages','fa-spa'],
  ['/manager/therapists','Therapists & Staff','fa-users'],
  ['/manager/time-off','Time-Off Requests','fa-calendar-check'],
  ['/manager/reports/payments','Reports','fa-chart-bar'],
  ['/manager/activity-logs','Activity Logs','fa-history'],
];
function sessionUser(){ try {return JSON.parse(sessionStorage.getItem('zenoraStaffUser')||'null')||{};}catch{return{};} }
// Reusable staff shell: the links and role can be provided by Receptionist in a later change.
export default function AppShell({role='Spa Manager', navigation=menu}) {
  const [menuOpen,setMenuOpen]=useState(false),[profileMenu,setProfileMenu]=useState(false),[profileOpen,setProfileOpen]=useState(false);
  const {pathname}=useLocation(),navigate=useNavigate(),user=useMemo(sessionUser,[]);
  const profileRef=useRef(null);
  const name = [user.first_name||user.firstName,user.last_name||user.lastName].filter(Boolean).join(' ') || 'Spa Manager';
  useEffect(()=>{setMenuOpen(false);setProfileMenu(false);},[pathname]);
  useEffect(()=>{
    if (!profileMenu) return;
    const outside=e=>{if(profileRef.current&&!profileRef.current.contains(e.target))setProfileMenu(false);};
    const escape=e=>{if(e.key==='Escape')setProfileMenu(false);};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[profileMenu]);
  const logout=()=>{sessionStorage.removeItem('zenoraStaffToken');sessionStorage.removeItem('zenoraStaffUser');navigate('/',{replace:true});};
  return <ToastProvider><div className="zenora-manager zm-shell">
    {menuOpen && <button className="zm-overlay" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>}
    <aside className={`zm-sidebar ${menuOpen?'is-open':''}`}>
      <NavLink to="/manager/dashboard" className="zm-brand">ZENORA<span>MANAGEMENT PORTAL</span></NavLink>
      <div className="zm-side-caption">WORKSPACE</div>
      <nav aria-label={`${role} navigation`} className="zm-side-nav">{navigation.map(([url,label,icon])=><NavLink key={url} to={url} end className={({isActive})=>`zm-nav-link ${isActive?'active':''}`}><i className={`fa ${icon}`} aria-hidden="true"/><span>{label}</span></NavLink>)}</nav>
      <div className="zm-side-foot">ZENORA · SPA & WELLNESS</div>
    </aside>
    <div className="zm-main-wrap"><div className="zm-topbar">
      <Button kind="icon" className="zm-toggle" onClick={()=>setMenuOpen(x=>!x)} aria-label="Toggle navigation" aria-expanded={menuOpen}><i className="fa fa-bars"/></Button>
      <span className="zm-topbar-caption">Manager Workspace</span>
      <div className="zm-profile-anchor" ref={profileRef}><button type="button" className="zm-profile-trigger" aria-label={`${name}, ${role}. Account menu`} onClick={()=>setProfileMenu(x=>!x)} aria-haspopup="menu" aria-expanded={profileMenu}>
        <span className="zm-avatar">{name.charAt(0).toUpperCase()}</span><span className="zm-profile-name"><strong>{name}</strong><small>{role}</small></span><i className={`fa ${profileMenu ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true"/>
      </button>{profileMenu&&<div role="menu" aria-label="Staff account menu" className="zm-profile-menu"><button type="button" role="menuitem" onClick={()=>{setProfileMenu(false);setProfileOpen(true);}}><i className="far fa-user" aria-hidden="true"/><span>My Profile</span></button><button type="button" role="menuitem" onClick={logout}><i className="fas fa-sign-out-alt" aria-hidden="true"/><span>Logout</span></button></div>}</div>
    </div><main className="zm-content"><Outlet/></main></div>
    <Modal open={profileOpen} onClose={()=>setProfileOpen(false)} title="My Profile"><div className="zm-detail-row"><strong>Name</strong><span>{name}</span></div><div className="zm-detail-row"><strong>Role</strong><span>{role}</span></div><div className="zm-detail-row"><strong>Email</strong><span>{user.email||'Not available'}</span></div><p className="zm-small">Profile editing requires a supported staff account API.</p></Modal>
  </div></ToastProvider>;
}
