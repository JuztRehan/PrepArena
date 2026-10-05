/* =====================================================================
   PREPARENA ADMIN CONSOLE

   Load AFTER preparena-access.js:

     <script src="preparena-access.js"></script>
     <script src="preparena-admin.js"></script>

   Reads plan names/limits from PrepArena.PLANS.
   Frontend authentication is for prototype/demo use only.
   Production version should use server-side authentication.
   ===================================================================== */

(function () {
'use strict';

const PA = window.PrepArena;

if (!PA) {
    console.warn(
        'preparena-admin.js: load preparena-access.js first.'
    );
    return;
}


/* =====================================================================
   1. DATA
   ===================================================================== */

const KEY = 'preparena_admin_users';
const INSTITUTIONS_KEY = 'preparena_admin_institutions';
const ADMIN_SESSION_KEY = 'preparena_admin_authenticated';

const ADMIN_USERNAME = 'Rehan@admin';
const ADMIN_PASSWORD = '#123Admin';


/* ---------------------------------------------------------------------
   Institution seed data
   --------------------------------------------------------------------- */

const INSTITUTIONS_SEED = {
    'Etech Academy': {
        verified: true,
        coordinatorName: 'Rehan Shaikh',
        coordinatorEmail: 'coordinator@etechacademy.com'
    }
};


/* ---------------------------------------------------------------------
   Demo users
   --------------------------------------------------------------------- */

const mk = (
    n,
    id,
    name,
    email,
    interviews,
    q,
    tokens,
    last,
    reg
) => ({
    id,
    name,
    email,
    institution: 'Etech Academy',
    institutionVerified: true,
    plan: PA.PLANS.free.name,
    status: 'Active',
    interviews,
    questionsAnswered: q,
    tokensUsed: tokens,
    lastActive: last,
    registeredAt: reg
});


const DEMO_USERS = [

    mk(
        1,
        'USR-001',
        'Aarav Patel',
        'aarav7923@gmail.com',
        6,
        28,
        280,
        'Today',
        '2026-09-18'
    ),

    mk(
        2,
        'USR-002',
        'Khan Aazam',
        'khan.aazam@scoe.edu',
        4,
        19,
        190,
        'Yesterday',
        '2026-09-19'
    ),

    mk(
        3,
        'USR-003',
        'Mohammed Sadiq',
        'sadiqmirza9859@gmail.com',
        5,
        23,
        230,
        'Today',
        '2026-09-21'
    ),

    mk(
        4,
        'USR-004',
        'Mohammed Taha',
        'tahageneral12@gmail.com',
        3,
        16,
        160,
        '2 days ago',
        '2026-09-22'
    ),

    mk(
        5,
        'USR-005',
        'Zubaida Khan',
        'zubaidakh56@gmail.com',
        7,
        34,
        340,
        'Today',
        '2026-09-24'
    ),

    mk(
        6,
        'USR-006',
        'Sneha Golkar',
        'itssneha345@gmail.com',
        4,
        21,
        210,
        'Yesterday',
        '2026-09-25'
    )

];


/* =====================================================================
   USER STORAGE
   ===================================================================== */

// [BACKEND SWAP]
// GET /api/admin/users

function getAdminUsers() {

    try {

        const saved = JSON.parse(
            localStorage.getItem(KEY)
        );

        if (
            Array.isArray(saved) &&
            saved.length
        ) {
            return saved;
        }

    } catch (e) {}

    try {
        localStorage.setItem(
            KEY,
            JSON.stringify(DEMO_USERS)
        );
    } catch (e) {}

    return DEMO_USERS.map(
        u => ({ ...u })
    );
}


/* =====================================================================
   INSTITUTION STORAGE
   ===================================================================== */

// [BACKEND SWAP]
// GET /api/admin/institutions

function getStoredInstitutions() {

    try {

        const saved = JSON.parse(
            localStorage.getItem(INSTITUTIONS_KEY)
        );

        if (
            Array.isArray(saved) &&
            saved.length
        ) {
            return saved;
        }

    } catch (e) {}

    const seeded = Object.entries(
        INSTITUTIONS_SEED
    ).map(([name, data]) => ({

        id: 'INST-001',

        name,

        verified: !!data.verified,

        coordinatorName:
            data.coordinatorName || '',

        coordinatorEmail:
            data.coordinatorEmail || ''

    }));

    try {

        localStorage.setItem(
            INSTITUTIONS_KEY,
            JSON.stringify(seeded)
        );

    } catch (e) {}

    return seeded;
}


function saveInstitutions(items) {

    try {

        localStorage.setItem(
            INSTITUTIONS_KEY,
            JSON.stringify(items)
        );

    } catch (e) {}

}


/* =====================================================================
   INSTITUTION HELPERS
   ===================================================================== */

function getInstitutions(users) {

    const stored =
        getStoredInstitutions();

    const names = new Set([

        ...stored.map(
            i => i.name
        ),

        ...users
            .map(u => u.institution)
            .filter(Boolean)

    ]);

    return [...names]
        .sort()
        .map(name => {

            const members =
                users.filter(
                    u => u.institution === name
                );

            const storedItem =
                stored.find(
                    i => i.name === name
                );

            const seed =
                INSTITUTIONS_SEED[name] || {};

            return {

                id:
                    storedItem?.id ||
                    (
                        'INST-' +
                        String(
                            stored.length + 1
                        ).padStart(3, '0')
                    ),

                name,

                verified:
                    storedItem?.verified ??
                    (
                        members.some(
                            u =>
                                u.institutionVerified
                        ) ||
                        !!seed.verified
                    ),

                coordinatorName:
                    storedItem?.coordinatorName ||
                    seed.coordinatorName ||
                    '',

                coordinatorEmail:
                    storedItem?.coordinatorEmail ||
                    seed.coordinatorEmail ||
                    '',

                members

            };

        });

}


function persistInstitution(inst) {

    const items =
        getStoredInstitutions();

    const index =
        items.findIndex(
            i => i.id === inst.id
        );

    if (index >= 0) {

        items[index] = inst;

    } else {

        items.push(inst);

    }

    saveInstitutions(items);
}


/* =====================================================================
   ANALYTICS HELPERS
   ===================================================================== */

const sum = (array, key) =>
    array.reduce(
        (total, item) =>
            total + (item[key] || 0),
        0
    );


const byPlan = (array, plan) =>
    array.filter(
        user => user.plan === plan
    ).length;


const planNames = () =>
    Object.values(PA.PLANS)
        .map(plan => plan.name);


/* =====================================================================
   2. CSS
   ===================================================================== */

const css = `

#pa-admin {

    position: fixed;

    inset: 0;

    z-index: 150;

    overflow-y: auto;

    display: none;

    background:
        linear-gradient(
            145deg,
            #0c0d0c,
            #171612 58%,
            #0f100e
        );
}


#pa-admin.on {

    display: block;

    animation:
        fadeUp .3s ease;

}


.ad-top {

    position: sticky;

    top: 0;

    z-index: 5;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 16px;

    flex-wrap: wrap;

    padding: 14px 32px;

    background:
        rgba(12,13,12,.9);

    backdrop-filter:
        blur(12px);

    border-bottom:
        1px solid var(--border);

}


.ad-top .lbl {

    font:
        600 11px
        'JetBrains Mono';

    letter-spacing:
        .14em;

    color:
        var(--cyan);

    border:
        1px solid
        rgba(214,182,111,.3);

    padding:
        4px 8px;

    border-radius:
        5px;

    margin-left:
        10px;

}


.ad-right {

    display:
        flex;

    align-items:
        center;

    gap:
        12px;

    font-size:
        13.5px;

}


.ad-av {

    width:
        34px;

    height:
        34px;

    border-radius:
        50%;

    background:
        var(--cyan);

    color:
        #17140d;

    display:
        grid;

    place-items:
        center;

    font:
        700 13px
        'Space Grotesk';

}


.ad-nav {

    display:
        flex;

    gap:
        6px;

    padding:
        14px 32px 0;

    flex-wrap:
        wrap;

}


.ad-nav button {

    background:
        transparent;

    border:
        0;

    border-bottom:
        2px solid
        transparent;

    color:
        var(--text-dim);

    padding:
        10px 14px;

    font:
        600 14px
        Inter;

    cursor:
        pointer;

}


.ad-nav button[aria-current=page] {

    color:
        var(--text);

    border-color:
        var(--cyan);

}


.ad-main {

    max-width:
        1180px;

    margin:
        0 auto;

    padding:
        28px 24px 70px;

}


.ad-main h1 {

    font-size:
        28px;

    letter-spacing:
        -.03em;

    margin:
        0 0 6px;

}


.ad-sub {

    color:
        var(--text-dim);

    font-size:
        14px;

    margin:
        0 0 24px;

}


.ad-kpis {

    display:
        grid;

    grid-template-columns:
        repeat(4,1fr);

    gap:
        14px;

    margin-bottom:
        22px;

}


.ad-two {

    display:
        grid;

    grid-template-columns:
        1fr 1fr;

    gap:
        18px;

    margin-bottom:
        22px;

}


.ad-h {

    font:
        600 12px
        'JetBrains Mono';

    letter-spacing:
        .12em;

    color:
        var(--text-dim);

    text-transform:
        uppercase;

    margin:
        0 0 16px;

}


.ad-bar {

    display:
        grid;

    grid-template-columns:
        78px 1fr 28px;

    gap:
        12px;

    align-items:
        center;

    margin-bottom:
        12px;

    font-size:
        13px;

}


.ad-bar span:last-child {

    font-family:
        'JetBrains Mono';

    text-align:
        right;

}


.ad-inst {

    display:
        flex;

    justify-content:
        space-between;

    align-items:
        center;

    gap:
        14px;

    width:
        100%;

    text-align:
        left;

    color:
        var(--text);

    padding:
        16px;

    margin-bottom:
        10px;

    border:
        1px solid
        var(--border);

    border-radius:
        10px;

    background:
        rgba(255,255,255,.03);

    transition:
        border-color .2s,
        transform .2s;

    cursor:
        pointer;

}


.ad-inst:hover {

    border-color:
        var(--cyan);

    transform:
        translateY(-2px);

}


.ad-inst b {

    font:
        600 16px
        'Space Grotesk';

}


.ad-inst small {

    display:
        block;

    color:
        var(--text-dim);

    margin-top:
        4px;

    font-size:
        12.5px;

}


.ad-b {

    display:
        inline-block;

    font:
        600 11px
        Inter;

    padding:
        3px 9px;

    border-radius:
        999px;

    border:
        1px solid
        var(--border);

    white-space:
        nowrap;

}


.ad-b.free {

    color:
        var(--text-dim);

}


.ad-b.paid {

    color:
        #17140d;

    background:
        var(--violet);

    border-color:
        transparent;

}


.ad-b.ok {

    color:
        var(--easy);

    border-color:
        rgba(121,186,140,.4);

}


.ad-tools {

    display:
        grid;

    grid-template-columns:
        1fr 180px 200px;

    gap:
        12px;

    margin-bottom:
        16px;

}


.ad-tablewrap {

    overflow-x:
        auto;

    border:
        1px solid
        var(--border);

    border-radius:
        12px;

}


.ad-table {

    width:
        100%;

    border-collapse:
        collapse;

    min-width:
        820px;

    font-size:
        13.5px;

}


.ad-table th {

    font:
        600 11px
        'JetBrains Mono';

    letter-spacing:
        .1em;

    color:
        var(--cyan);

    text-align:
        left;

    padding:
        13px 14px;

    border-bottom:
        1px solid
        var(--border);

    text-transform:
        uppercase;

}


.ad-table td {

    padding:
        13px 14px;

    border-bottom:
        1px solid
        var(--border);

}


.ad-table tr:last-child td {

    border-bottom:
        0;

}


.ad-table .n {

    text-align:
        right;

    font-family:
        'JetBrains Mono';

}


.ad-table small {

    display:
        block;

    color:
        var(--text-dim);

    font-size:
        12px;

}


.ad-empty {

    text-align:
        center;

    color:
        var(--text-dim);

    padding:
        34px;

}


.ad-section-head {

    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    gap:
        16px;

    margin:
        28px 0 14px;

    flex-wrap:
        wrap;

}


.ad-section-head h2 {

    font:
        600 14px
        'JetBrains Mono';

    letter-spacing:
        .12em;

    text-transform:
        uppercase;

    color:
        var(--text-dim);

    margin:
        0;

}


.ad-analytics {

    display:
        grid;

    grid-template-columns:
        1.45fr .55fr;

    gap:
        18px;

    margin-bottom:
        22px;

}


.ad-plan-chart {

    padding:
        22px;

}


.ad-plan-row {

    display:
        grid;

    grid-template-columns:
        86px 1fr 58px 54px;

    gap:
        12px;

    align-items:
        center;

    margin:
        18px 0;

}


.ad-plan-name {

    font:
        600 12px
        'JetBrains Mono';

    color:
        var(--text);

}


.ad-plan-track {

    height:
        10px;

    background:
        rgba(255,255,255,.07);

    border-radius:
        999px;

    overflow:
        hidden;

}


.ad-plan-fill {

    height:
        100%;

    border-radius:
        999px;

    background:
        linear-gradient(
            90deg,
            var(--cyan),
            var(--violet)
        );

    transition:
        width .35s ease;

}


.ad-plan-count,
.ad-plan-pct {

    font:
        600 12px
        'JetBrains Mono';

    text-align:
        right;

}


.ad-plan-pct {

    color:
        var(--text-dim);

}


.ad-analytics-side {

    display:
        grid;

    grid-template-columns:
        1fr;

    gap:
        10px;

}


.ad-mini {

    padding:
        16px;

    border:
        1px solid
        var(--border);

    border-radius:
        10px;

    background:
        rgba(255,255,255,.025);

}


.ad-mini-label {

    font:
        600 10px
        'JetBrains Mono';

    letter-spacing:
        .1em;

    color:
        var(--text-dim);

    text-transform:
        uppercase;

}


.ad-mini-value {

    font:
        700 22px
        'Space Grotesk';

    margin-top:
        5px;

}


.ad-mini-note {

    font-size:
        11.5px;

    color:
        var(--text-dim);

    margin-top:
        3px;

}


.ad-modal {

    position:
        fixed;

    inset:
        0;

    z-index:
        500;

    display:
        none;

    align-items:
        center;

    justify-content:
        center;

    padding:
        20px;

    background:
        rgba(0,0,0,.62);

    backdrop-filter:
        blur(8px);

}


.ad-modal.on {

    display:
        flex;

}


.ad-modal-card {

    width:
        min(520px,100%);

    padding:
        26px;

    background:
        #191713;

    border:
        1px solid
        var(--border);

    border-radius:
        16px;

    box-shadow:
        0 30px 100px
        rgba(0,0,0,.55);

}


.ad-modal-head {

    display:
        flex;

    align-items:
        flex-start;

    justify-content:
        space-between;

    gap:
        15px;

    margin-bottom:
        20px;

}


.ad-modal-title {

    font:
        700 22px
        'Space Grotesk';

    margin:
        0;

}


.ad-modal-sub {

    font-size:
        13px;

    color:
        var(--text-dim);

    margin:
        5px 0 0;

}


.ad-close {

    border:
        0;

    background:
        transparent;

    color:
        var(--text-dim);

    font-size:
        22px;

    cursor:
        pointer;

}


.ad-field {

    margin-bottom:
        15px;

}


.ad-field label {

    display:
        block;

    font:
        600 11px
        'JetBrains Mono';

    color:
        var(--text-dim);

    margin-bottom:
        7px;

    text-transform:
        uppercase;

    letter-spacing:
        .08em;

}


.ad-field input,
.ad-field select {

    width:
        100%;

    box-sizing:
        border-box;

    background:
        rgba(255,255,255,.045);

    color:
        var(--text);

    border:
        1px solid
        var(--border);

    border-radius:
        8px;

    padding:
        11px 12px;

    font:
        14px Inter;

    outline:
        none;

}


.ad-field input:focus,
.ad-field select:focus {

    border-color:
        var(--cyan);

}


.ad-modal-actions {

    display:
        flex;

    justify-content:
        flex-end;

    gap:
        10px;

    margin-top:
        20px;

}


.ad-form-error {

    display:
        none;

    color:
        #e88d8d;

    font-size:
        12px;

    margin-top:
        10px;

}


.ad-form-error.on {

    display:
        block;

}


.ad-add-btn {

    border:
        1px solid
        rgba(214,182,111,.45);

    background:
        rgba(214,182,111,.08);

    color:
        var(--cyan);

    border-radius:
        8px;

    padding:
        9px 14px;

    font:
        600 12px
        Inter;

    cursor:
        pointer;

}


.ad-add-btn:hover {

    background:
        rgba(214,182,111,.15);

}


@media (max-width: 900px) {

    .ad-kpis {

        grid-template-columns:
            repeat(2,1fr);

    }

    .ad-two,
    .ad-analytics {

        grid-template-columns:
            1fr;

    }

}


@media (max-width: 650px) {

    .ad-top {

        padding:
            12px 18px;

    }

    .ad-nav {

        padding:
            12px 18px 0;

    }

    .ad-main {

        padding:
            22px 16px 60px;

    }

    .ad-tools {

        grid-template-columns:
            1fr;

    }

    .ad-kpis {

        grid-template-columns:
            1fr 1fr;

    }

    .ad-plan-row {

        grid-template-columns:
            70px 1fr 40px 44px;

        gap:
            7px;

    }

}

`;


/* =====================================================================
   3. UI HELPERS
   ===================================================================== */

function esc(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function kpi(value, label, note) {

    return `
        <div class="card">

            <div class="ad-h">
                ${esc(label)}
            </div>

            <div
                style="
                    font:700 25px 'Space Grotesk';
                "
            >
                ${esc(value)}
            </div>

            ${
                note
                    ? `
                        <div
                            style="
                                font-size:11px;
                                color:var(--text-dim);
                                margin-top:4px;
                            "
                        >
                            ${esc(note)}
                        </div>
                    `
                    : ''
            }

        </div>
    `;

}


function planBadge(plan) {

    const premium =
        plan !== PA.PLANS.free.name;

    return `
        <span
            class="ad-b ${
                premium
                    ? 'paid'
                    : 'free'
            }"
        >
            ${esc(plan)}
        </span>
    `;

}


/* =====================================================================
   ADMIN ROOT
   ===================================================================== */

const root =
    document.createElement('div');

root.id =
    'pa-admin';

document.body.appendChild(root);


const modal =
    document.createElement('div');

modal.className =
    'ad-modal';

document.body.appendChild(modal);


const style =
    document.createElement('style');

style.textContent =
    css;

document.head.appendChild(style);


/* =====================================================================
   STATE
   ===================================================================== */

const S = {

    view: 'overview',

    q: '',

    plan: 'all',

    institution: 'all',

    inst: null,

    editingInst: null

};


/* =====================================================================
   DOM HELPER
   ===================================================================== */

function $(selector) {

    return root.querySelector(selector);

}


/* =====================================================================
   LOGIN
   ===================================================================== */

function showAdminLogin() {

    modal.classList.add('on');

    modal.innerHTML = `
        <div class="ad-modal-card" style="max-width:420px">

            <div class="ad-modal-head">
                <div>
                    <h2 class="ad-modal-title">
                        Admin Login
                    </h2>

                    <p class="ad-modal-sub">
                        Sign in to access the PrepArena administration dashboard.
                    </p>
                </div>
            </div>

            <form id="ad-login-form">

                <div class="ad-field">
                    <label>Username</label>

                    <input
                        id="ad-login-user"
                        type="text"
                        autocomplete="username"
                        required
                    >
                </div>

                <div class="ad-field">
                    <label>Password</label>

                    <input
                        id="ad-login-pass"
                        type="password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <div
                    id="ad-login-error"
                    class="ad-form-error"
                ></div>

                <div class="ad-modal-actions">

                    <button
                        type="button"
                        class="btn-secondary"
                        id="ad-login-cancel"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn-primary"
                        id="ad-login-submit"
                    >
                        Sign in
                    </button>

                </div>

            </form>

        </div>
    `;


    const form =
        document.getElementById(
            'ad-login-form'
        );

    const usernameInput =
        document.getElementById(
            'ad-login-user'
        );

    const passwordInput =
        document.getElementById(
            'ad-login-pass'
        );

    const error =
        document.getElementById(
            'ad-login-error'
        );

    const submit =
        document.getElementById(
            'ad-login-submit'
        );

    const cancel =
        document.getElementById(
            'ad-login-cancel'
        );


    cancel.addEventListener(
        'click',
        function () {

            closeInstitutionModal();

        }
    );


    form.addEventListener(
        'submit',
        function (event) {

            event.preventDefault();


            const username =
                usernameInput.value.trim();

            const password =
                passwordInput.value;


            console.log(
                'PrepArena Admin Login:',
                username
            );


            if (
                username !== ADMIN_USERNAME ||
                password !== ADMIN_PASSWORD
            ) {

                error.textContent =
                    'Incorrect username or password.';

                error.classList.add('on');

                passwordInput.value = '';

                passwordInput.focus();

                return;

            }


            /*
             * Credentials are correct.
             */

            sessionStorage.setItem(
                ADMIN_SESSION_KEY,
                'true'
            );


            console.log(
                'PrepArena Admin: authentication successful'
            );


            /*
             * Remove login modal first.
             */

            modal.classList.remove('on');

            modal.innerHTML = '';


            /*
             * Open dashboard.
             */

            root.classList.add('on');


            /*
             * Reset dashboard state.
             */

            S.view = 'overview';

            S.inst = null;

            S.q = '';

            S.plan = 'all';

            S.institution = 'all';


            /*
             * Render dashboard.
             */

            try {

                render();

            } catch (err) {

                console.error(
                    'PrepArena Admin Dashboard Error:',
                    err
                );

                /*
                 * If the dashboard itself has
                 * another error, show it instead
                 * of appearing to do nothing.
                 */

                root.innerHTML = `

                    <div
                        style="
                            max-width:700px;
                            margin:100px auto;
                            padding:30px;
                            color:white;
                        "
                    >

                        <h2>
                            Admin authenticated
                        </h2>

                        <p>
                            Login worked, but the
                            dashboard encountered
                            a JavaScript error.
                        </p>

                        <pre
                            style="
                                white-space:pre-wrap;
                                background:#111;
                                padding:15px;
                                border-radius:8px;
                                color:#ffb4b4;
                            "
                        >${String(err.stack || err)}</pre>

                    </div>

                `;

            }

        }
    );


    /*
     * Automatically focus username.
     */

    setTimeout(
        function () {

            usernameInput.focus();

        },
        50
    );

}


/* =====================================================================
   ADD / EDIT INSTITUTION MODAL
   ===================================================================== */

function showInstitutionModal(inst = null) {

    S.editingInst =
        inst
            ? inst.name
            : null;

    const editing =
        !!inst;


    modal.classList.add('on');


    modal.innerHTML = `

        <div class="ad-modal-card">

            <div class="ad-modal-head">

                <div>

                    <h2 class="ad-modal-title">

                        ${
                            editing
                                ? 'Edit Institution'
                                : 'Add Institution'
                        }

                    </h2>

                    <p class="ad-modal-sub">

                        ${
                            editing
                                ? 'Update institution and coordinator details.'
                                : 'Create an institution and assign its coordinator.'
                        }

                    </p>

                </div>


                <button
                    class="ad-close"
                    id="ad-modal-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <form id="ad-inst-form">

                <div class="ad-field">

                    <label>
                        Institution Name
                    </label>

                    <input
                        id="ad-inst-name"
                        value="${esc(inst?.name || '')}"
                        placeholder="Enter institution name"
                        required
                    >

                </div>


                <div class="ad-field">

                    <label>
                        Coordinator Name
                    </label>

                    <input
                        id="ad-coord-name"
                        value="${esc(inst?.coordinatorName || '')}"
                        placeholder="Enter coordinator name"
                        required
                    >

                </div>


                <div class="ad-field">

                    <label>
                        Coordinator Email
                    </label>

                    <input
                        id="ad-coord-email"
                        type="email"
                        value="${esc(inst?.coordinatorEmail || '')}"
                        placeholder="coordinator@example.com"
                        required
                    >

                </div>


                <div class="ad-field">

                    <label>
                        Institution Status
                    </label>

                    <select id="ad-inst-status">

                        <option
                            value="verified"
                            ${
                                inst?.verified !== false
                                    ? 'selected'
                                    : ''
                            }
                        >
                            Verified
                        </option>

                        <option
                            value="pending"
                            ${
                                inst?.verified === false
                                    ? 'selected'
                                    : ''
                            }
                        >
                            Pending
                        </option>

                    </select>

                </div>


                <div
                    id="ad-inst-error"
                    class="ad-form-error"
                ></div>


                <div class="ad-modal-actions">

                    <button
                        type="button"
                        class="btn-secondary"
                        id="ad-modal-cancel"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn-primary"
                    >

                        ${
                            editing
                                ? 'Save Changes'
                                : 'Add Institution'
                        }

                    </button>

                </div>

            </form>

        </div>

    `;


    $('#ad-modal-close')
        .onclick =
        closeInstitutionModal;


    $('#ad-modal-cancel')
        .onclick =
        closeInstitutionModal;


    $('#ad-inst-form')
        .onsubmit = e => {

            e.preventDefault();

            saveInstitutionFromForm();

        };

}


function closeInstitutionModal() {

    modal.classList.remove('on');

    modal.innerHTML = '';

    S.editingInst = null;

}


/* =====================================================================
   SAVE INSTITUTION
   ===================================================================== */

function saveInstitutionFromForm() {

    const name =
        $('#ad-inst-name')
            .value
            .trim();

    const coordinatorName =
        $('#ad-coord-name')
            .value
            .trim();

    const coordinatorEmail =
        $('#ad-coord-email')
            .value
            .trim();

    const verified =
        $('#ad-inst-status')
            .value === 'verified';


    const error =
        $('#ad-inst-error');


    if (
        !name ||
        !coordinatorName ||
        !coordinatorEmail
    ) {

        error.textContent =
            'All fields are required.';

        error.classList.add('on');

        return;

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(coordinatorEmail)
    ) {

        error.textContent =
            'Enter a valid coordinator email.';

        error.classList.add('on');

        return;

    }


    const existing =
        getStoredInstitutions();


    const duplicate =
        existing.find(
            i =>
                i.name.toLowerCase() ===
                name.toLowerCase() &&
                i.name !== S.editingInst
        );


    if (duplicate) {

        error.textContent =
            'An institution with this name already exists.';

        error.classList.add('on');

        return;

    }


    const oldInstitution =
        S.editingInst;


    const existingInstitution =
        existing.find(
            i => i.name === oldInstitution
        );


    const item = {

        id:
            existingInstitution?.id ||
            (
                'INST-' +
                String(
                    existing.length + 1
                ).padStart(3, '0')
            ),

        name,

        verified,

        coordinatorName,

        coordinatorEmail

    };


    /*
       If the institution name changes,
       update all students belonging to it.
    */

    if (
        oldInstitution &&
        oldInstitution !== name
    ) {

        const users =
            getAdminUsers();


        users.forEach(user => {

            if (
                user.institution ===
                oldInstitution
            ) {

                user.institution =
                    name;

                user.institutionVerified =
                    verified;

            }

        });


        try {

            localStorage.setItem(
                KEY,
                JSON.stringify(users)
            );

        } catch (e) {}


        const cleaned =
            existing.filter(
                i =>
                    i.name !==
                    oldInstitution
            );


        saveInstitutions(
            cleaned
        );

    }


    persistInstitution(
        item
    );


    closeInstitutionModal();


    S.inst = null;

    S.view =
        'institutions';


    render();

}


/* =====================================================================
   OVERVIEW
   ===================================================================== */

function overviewView(users, institutions) {

    const total =
        users.length;

    const interviews =
        sum(users, 'interviews');

    const questions =
        sum(users, 'questionsAnswered');

    const tokens =
        sum(users, 'tokensUsed');


    const plans =
        planNames();


    const counts =
        plans.map(
            plan => ({
                plan,
                count:
                    byPlan(
                        users,
                        plan
                    )
            })
        );


    const dominant =
        [...counts]
            .sort(
                (a, b) =>
                    b.count -
                    a.count
            )[0];


    const freeCount =
        byPlan(
            users,
            PA.PLANS.free.name
        );


    const paidCount =
        total -
        freeCount;


    const freeShare =
        total
            ? Math.round(
                freeCount /
                total *
                100
            )
            : 0;


    const paidConversion =
        total
            ? Math.round(
                paidCount /
                total *
                100
            )
            : 0;


    const institutionStudents =
        users.filter(
            user =>
                !!user.institution
        ).length;


    const institutionCoverage =
        total
            ? Math.round(
                institutionStudents /
                total *
                100
            )
            : 0;


    /*
       ---------------------------------------------------------------
       ACTIVITY CHART DATA
       Creates a 30-day stock-chart-style activity graph.
       Each point represents total activity up to that date.
       ---------------------------------------------------------------
    */

    const today =
        new Date();

    const chartData = [];

    let runningActivity = 0;


    for (let i = 29; i >= 0; i--) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() - i
        );


        const dateKey =
            date
                .toISOString()
                .split('T')[0];


        const dailyUsers =
            users.filter(
                user =>
                    user.registeredAt ===
                    dateKey
            );


        const dailyActivity =
            dailyUsers.reduce(
                (sum, user) =>
                    sum +
                    (user.interviews || 0) +
                    (user.questionsAnswered || 0),
                0
            );


        runningActivity +=
            dailyActivity;


        chartData.push({

            date:
                date.toLocaleDateString(
                    'en-IN',
                    {
                        day: '2-digit',
                        month: 'short'
                    }
                ),

            activity:
                runningActivity

        });

    }


    /*
       If the demo dates are outside the current
       30-day window, create a useful baseline.
    */

    if (
        chartData.every(
            point =>
                point.activity === 0
        )
    ) {

        let value = 25;

        chartData.forEach(
            point => {

                value +=
                    Math.floor(
                        Math.random() * 12
                    ) - 3;

                value =
                    Math.max(
                        5,
                        value
                    );

                point.activity =
                    value;

            }
        );

    }


    return `

        <h1>
            Admin Overview
        </h1>

        <p class="ad-sub">
            Monitor PrepArena users,
            institutions and product usage.
        </p>


        <div class="ad-kpis">

            ${kpi(
                total,
                'Total Users',
                'Registered students'
            )}

            ${kpi(
                institutions.length,
                'Institutions',
                'Active institution records'
            )}

            ${kpi(
                interviews,
                'Interviews',
                'Total completed'
            )}

            ${kpi(
                tokens,
                'Tokens Used',
                'Across all students'
            )}

        </div>


        <!-- =========================================================
             STOCK MARKET STYLE ACTIVITY GRAPH
             ========================================================= -->

        <div class="card"
             style="
                padding:24px;
                margin-bottom:22px;
             ">

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:16px;
                    margin-bottom:20px;
                "
            >

                <div>

                    <div class="ad-h">
                        Platform Activity
                    </div>

                    <div
                        style="
                            font:700 28px 'Space Grotesk';
                            margin-top:6px;
                        "
                    >
                        ${chartData.at(-1)?.activity || 0}
                    </div>

                    <div
                        style="
                            color:var(--text-dim);
                            font-size:12px;
                            margin-top:4px;
                        "
                    >
                        Cumulative activity · Last 30 days
                    </div>

                </div>


                <div
                    style="
                        padding:6px 10px;
                        border:1px solid rgba(214,182,111,.3);
                        border-radius:7px;
                        color:var(--cyan);
                        font:600 11px 'JetBrains Mono';
                    "
                >
                    30D
                </div>

            </div>


            <div
                style="
                    position:relative;
                    height:280px;
                    width:100%;
                "
            >

                <svg
                    viewBox="0 0 1000 280"
                    preserveAspectRatio="none"
                    style="
                        width:100%;
                        height:100%;
                        overflow:visible;
                    "
                >

                    ${
                        (() => {

                            const values =
                                chartData.map(
                                    d => d.activity
                                );

                            const min =
                                Math.min(...values);

                            const max =
                                Math.max(...values);

                            const range =
                                Math.max(
                                    1,
                                    max - min
                                );


                            const points =
                                chartData
                                    .map(
                                        (d, index) => {

                                            const x =
                                                (
                                                    index /
                                                    Math.max(
                                                        1,
                                                        chartData.length - 1
                                                    )
                                                ) * 960 + 20;

                                            const y =
                                                240 -
                                                (
                                                    (
                                                        d.activity -
                                                        min
                                                    ) /
                                                    range
                                                ) * 200;

                                            return {
                                                x,
                                                y,
                                                value:
                                                    d.activity,
                                                date:
                                                    d.date
                                            };

                                        }
                                    );


                            const line =
                                points
                                    .map(
                                        (p, i) =>
                                            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                                    )
                                    .join(' ');


                            const area =
                                `${line} L 980 240 L 20 240 Z`;


                            return `

                                <!-- Grid -->

                                <line
                                    x1="20"
                                    y1="40"
                                    x2="980"
                                    y2="40"
                                    stroke="rgba(255,255,255,.06)"
                                    stroke-width="1"
                                />

                                <line
                                    x1="20"
                                    y1="140"
                                    x2="980"
                                    y2="140"
                                    stroke="rgba(255,255,255,.06)"
                                    stroke-width="1"
                                />

                                <line
                                    x1="20"
                                    y1="240"
                                    x2="980"
                                    y2="240"
                                    stroke="rgba(255,255,255,.08)"
                                    stroke-width="1"
                                />


                                <!-- Area -->

                                <path
                                    d="${area}"
                                    fill="rgba(214,182,111,.08)"
                                    stroke="none"
                                />


                                <!-- Main line -->

                                <path
                                    d="${line}"
                                    fill="none"
                                    stroke="var(--cyan)"
                                    stroke-width="3"
                                    vector-effect="non-scaling-stroke"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />


                                <!-- Data points -->

                                ${
                                    points
                                        .map(
                                            p => `

                                                <circle
                                                    cx="${p.x}"
                                                    cy="${p.y}"
                                                    r="4"
                                                    fill="var(--cyan)"
                                                    stroke="#171612"
                                                    stroke-width="2"
                                                >
                                                    <title>
                                                        ${p.date} — ${p.value} activity
                                                    </title>
                                                </circle>

                                            `
                                        )
                                        .join('')
                                }

                            `;

                        })()
                    }

                </svg>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    color:var(--text-dim);
                    font:500 10px 'JetBrains Mono';
                    margin-top:8px;
                "
            >

                <span>
                    ${chartData[0]?.date || ''}
                </span>

                <span>
                    ${chartData[
                        Math.floor(
                            chartData.length / 2
                        )
                    ]?.date || ''}
                </span>

                <span>
                    ${chartData.at(-1)?.date || ''}
                </span>

            </div>

        </div>


        <!-- =========================================================
             PLAN ANALYTICS
             ========================================================= -->

        <div class="ad-analytics">

            <div class="card ad-plan-chart">

                <div class="ad-section-head">

                    <h2>
                        Users by Plan
                    </h2>

                    <span
                        class="ad-b ok"
                    >
                        ${total} users
                    </span>

                </div>


                ${
                    counts.map(
                        item => {

                            const pct =
                                total
                                    ? Math.round(
                                        item.count /
                                        total *
                                        100
                                    )
                                    : 0;


                            const maxCount =
                                Math.max(
                                    1,
                                    ...counts.map(
                                        x => x.count
                                    )
                                );


                            const width =
                                Math.round(
                                    item.count /
                                    maxCount *
                                    100
                                );


                            return `

                                <div class="ad-plan-row">

                                    <div
                                        class="ad-plan-name"
                                    >
                                        ${esc(item.plan)}
                                    </div>


                                    <div
                                        class="ad-plan-track"
                                        title="${pct}% of users"
                                    >

                                        <div
                                            class="ad-plan-fill"
                                            style="
                                                width:${width}%;
                                            "
                                        ></div>

                                    </div>


                                    <div
                                        class="ad-plan-count"
                                    >
                                        ${item.count}
                                    </div>


                                    <div
                                        class="ad-plan-pct"
                                    >
                                        ${pct}%
                                    </div>

                                </div>

                            `;

                        }
                    ).join('')
                }

            </div>


            <div class="ad-analytics-side">

                <div class="ad-mini">

                    <div class="ad-mini-label">
                        Dominant Plan
                    </div>

                    <div class="ad-mini-value">
                        ${esc(
                            dominant?.plan ||
                            '—'
                        )}
                    </div>

                    <div class="ad-mini-note">
                        ${dominant?.count || 0}
                        users
                    </div>

                </div>


                <div class="ad-mini">

                    <div class="ad-mini-label">
                        Free User Share
                    </div>

                    <div class="ad-mini-value">
                        ${freeShare}%
                    </div>

                    <div class="ad-mini-note">
                        ${freeCount}
                        free users
                    </div>

                </div>


                <div class="ad-mini">

                    <div class="ad-mini-label">
                        Paid Conversion
                    </div>

                    <div class="ad-mini-value">
                        ${paidConversion}%
                    </div>

                    <div class="ad-mini-note">
                        ${paidCount}
                        paid users
                    </div>

                </div>


                <div class="ad-mini">

                    <div class="ad-mini-label">
                        Institution Coverage
                    </div>

                    <div class="ad-mini-value">
                        ${institutionCoverage}%
                    </div>

                    <div class="ad-mini-note">
                        ${institutionStudents}
                        students linked to institutions
                    </div>

                </div>

            </div>

        </div>


        <div class="ad-two">

            <div class="card">

                <div class="ad-h">
                    Platform Activity
                </div>

                ${kpi(
                    questions,
                    'Questions Answered',
                    'Across all interviews'
                )}

                ${kpi(
                    interviews,
                    'Interviews Completed',
                    'Total'
                )}

            </div>


            <div class="card">

                <div class="ad-h">
                    Institution Adoption
                </div>

                ${kpi(
                    institutions.length,
                    'Active Institutions',
                    ''
                )}

                ${kpi(
                    institutionStudents,
                    'Students via Institutions',
                    ''
                )}

            </div>

        </div>

    `;

}   


/* =====================================================================
   INSTITUTIONS VIEW
   ===================================================================== */

function institutionsView(users) {

    const institutions =
        getInstitutions(users);


    if (S.inst) {

        const selected =
            institutions.find(
                i => i.name === S.inst
            );

        if (selected) {

            return institutionDetailView(
                selected
            );

        }

    }


    return `

        <div class="ad-section-head">

            <div>

                <h1>
                    Institutions
                </h1>

                <p class="ad-sub">
                    Manage institutions,
                    coordinators and adoption.
                </p>

            </div>


            <button
                class="ad-add-btn"
                id="ad-add-institution"
                type="button"
            >
                + Add an Institution
            </button>

        </div>


        <div class="ad-kpis">

            ${kpi(
                institutions.length,
                'Institutions',
                'Total records'
            )}

            ${kpi(
                institutions.filter(
                    i => i.verified
                ).length,
                'Verified',
                ''
            )}

            ${kpi(
                users.filter(
                    u => u.institution
                ).length,
                'Students Linked',
                ''
            )}

            ${kpi(
                users.filter(
                    u =>
                        u.institution &&
                        u.plan !==
                            PA.PLANS.free.name
                ).length,
                'Paid Students',
                ''
            )}

        </div>


        <div>

            ${
                institutions.length

                    ? institutions
                        .map(i => {

                            const students =
                                i.members.length;

                            const paid =
                                i.members.filter(
                                    u =>
                                        u.plan !==
                                        PA.PLANS.free.name
                                ).length;

                            return `

                                <button
                                    class="ad-inst"
                                    data-inst="${esc(i.name)}"
                                    type="button"
                                >

                                    <div>

                                        <b>
                                            ${esc(i.name)}
                                        </b>

                                        <small>
                                            Coordinator:
                                            ${
                                                esc(
                                                    i.coordinatorName ||
                                                    'Not assigned'
                                                )
                                            }
                                        </small>

                                        <small>
                                            ${
                                                esc(
                                                    i.coordinatorEmail ||
                                                    'No email recorded'
                                                )
                                            }
                                        </small>

                                    </div>


                                    <div
                                        style="
                                            display:flex;
                                            align-items:center;
                                            gap:8px;
                                            flex-wrap:wrap;
                                            justify-content:flex-end;
                                        "
                                    >

                                        <span class="ad-b">
                                            ${students}
                                            Students
                                        </span>

                                        <span class="ad-b">
                                            ${paid}
                                            Paid
                                        </span>

                                        ${
                                            i.verified

                                                ? `
                                                    <span
                                                        class="ad-b ok"
                                                    >
                                                        Verified
                                                    </span>
                                                `

                                                : `
                                                    <span
                                                        class="ad-b"
                                                    >
                                                        Pending
                                                    </span>
                                                `
                                        }

                                    </div>

                                </button>

                            `;

                        }).join('')

                    : `
                        <div class="card ad-empty">
                            No institutions found.
                        </div>
                    `
            }

        </div>

    `;

}


/* =====================================================================
   INSTITUTION DETAIL
   ===================================================================== */

function institutionDetailView(i) {

    const members =
        i.members;

    const plans =
        planNames();


    return `

        <div class="ad-section-head">

            <div>

                <button
                    class="ad-add-btn"
                    id="ad-back-institutions"
                    type="button"
                    style="margin-bottom:12px"
                >
                    ← Back to Institutions
                </button>

                <h1>
                    ${esc(i.name)}
                </h1>

                <p class="ad-sub">
                    Institution administration
                    and student overview.
                </p>

            </div>


            <button
                class="ad-add-btn"
                id="ad-edit-institution"
                type="button"
            >
                Edit Institution
            </button>

        </div>


        <div class="card">

            <div class="ad-h">
                Coordinator
            </div>

            <div
                style="
                    font:600 18px 'Space Grotesk';
                "
            >
                ${esc(
                    i.coordinatorName ||
                    'Not assigned'
                )}
            </div>

            <div
                class="ad-sub"
                style="
                    margin:4px 0 0;
                "
            >
                ${esc(
                    i.coordinatorEmail ||
                    'No email recorded'
                )}
            </div>

        </div>


        <div
            class="ad-kpis"
            style="
                grid-template-columns:
                repeat(4,1fr);
            "
        >

            ${kpi(
                members.length,
                'Students',
                ''
            )}

            ${kpi(
                byPlan(
                    members,
                    plans[0]
                ),
                plans[0],
                ''
            )}

            ${kpi(
                byPlan(
                    members,
                    plans[1]
                ),
                plans[1],
                ''
            )}

            ${kpi(
                byPlan(
                    members,
                    plans[2]
                ),
                plans[2],
                ''
            )}

        </div>


        <div
            class="ad-kpis"
            style="
                grid-template-columns:
                repeat(3,1fr);
            "
        >

            ${kpi(
                sum(
                    members,
                    'interviews'
                ),
                'Total Interviews',
                ''
            )}

            ${kpi(
                sum(
                    members,
                    'questionsAnswered'
                ),
                'Questions Answered',
                ''
            )}

            ${kpi(
                sum(
                    members,
                    'tokensUsed'
                ),
                'Tokens Used',
                ''
            )}

        </div>


        <div class="ad-h">
            Students
        </div>


        <div class="ad-tablewrap">

            <table class="ad-table">

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Plan
                        </th>

                        <th class="n">
                            Interviews
                        </th>

                        <th class="n">
                            Questions
                        </th>

                        <th class="n">
                            Tokens Used
                        </th>

                        <th>
                            Last Active
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        members.length

                            ? members
                                .map(
                                    u => `

                                    <tr>

                                        <td>

                                            ${esc(u.name)}

                                            <small>
                                                ${esc(u.email)}
                                            </small>

                                        </td>

                                        <td>
                                            ${planBadge(u.plan)}
                                        </td>

                                        <td class="n">
                                            ${u.interviews}
                                        </td>

                                        <td class="n">
                                            ${u.questionsAnswered}
                                        </td>

                                        <td class="n">
                                            ${u.tokensUsed}
                                        </td>

                                        <td>
                                            ${esc(u.lastActive)}
                                        </td>

                                    </tr>

                                `
                                )
                                .join('')

                            : `
                                <tr>
                                    <td
                                        colspan="6"
                                        class="ad-empty"
                                    >
                                        No students assigned.
                                    </td>
                                </tr>
                            `
                    }

                </tbody>

            </table>

        </div>

    `;

}


/* =====================================================================
   USERS VIEW
   ===================================================================== */

function usersView() {

    return `

        <h1>
            All Users
        </h1>

        <p class="ad-sub">
            Search and filter registered students.
        </p>


        <div class="ad-tools">

            <input
                class="library-search"
                id="ad-q"
                type="search"
                placeholder="Search students, institutions or coordinators..."
                aria-label="Search students or institutions"
                value="${esc(S.q)}"
            >


            <select
                class="library-filter"
                id="ad-plan"
                aria-label="Filter by plan"
            ></select>


            <select
                class="library-filter"
                id="ad-inst"
                aria-label="Filter by institution"
            ></select>

        </div>


        <div
            class="ad-cnt"
            id="ad-cnt"
        ></div>


        <div class="ad-tablewrap">

            <table class="ad-table">

                <thead>

                    <tr>

                        <th>
                            Student
                        </th>

                        <th>
                            Institution
                        </th>

                        <th>
                            Coordinator
                        </th>

                        <th>
                            Plan
                        </th>

                        <th>
                            Status
                        </th>

                        <th class="n">
                            Interviews
                        </th>

                        <th class="n">
                            Tokens Used
                        </th>

                        <th>
                            Last Active
                        </th>

                    </tr>

                </thead>


                <tbody
                    id="ad-rows"
                ></tbody>

            </table>

        </div>

    `;

}


/* =====================================================================
   USER FILTERS
   ===================================================================== */

function fillFilters(
    users,
    institutions
) {

    $('#ad-plan').innerHTML =

        '<option value="all">' +
        'All Plans' +
        '</option>' +

        planNames()
            .map(
                plan => `
                    <option
                        value="${esc(plan)}"
                        ${
                            S.plan === plan
                                ? 'selected'
                                : ''
                        }
                    >
                        ${esc(plan)}
                    </option>
                `
            )
            .join('');


    $('#ad-inst').innerHTML =

        '<option value="all">' +
        'All Institutions' +
        '</option>' +

        institutions
            .map(
                institution => `
                    <option
                        value="${esc(institution.name)}"
                        ${
                            S.institution ===
                            institution.name
                                ? 'selected'
                                : ''
                        }
                    >
                        ${esc(institution.name)}
                    </option>
                `
            )
            .join('');


    $('#ad-q').oninput =
        e => {

            S.q =
                e.target.value;

            drawTable(users);

        };


    $('#ad-plan').onchange =
        e => {

            S.plan =
                e.target.value;

            drawTable(users);

        };


    $('#ad-inst').onchange =
        e => {

            S.institution =
                e.target.value;

            drawTable(users);

        };

}


/* =====================================================================
   USER TABLE
   ===================================================================== */

function drawTable(users) {

    const institutions =
        getInstitutions(users);


    const q =
        S.q
            .trim()
            .toLowerCase();


    const rows =
        users.filter(user => {

            const institution =
                institutions.find(
                    i =>
                        i.name ===
                        user.institution
                );


            const coordinator =
                institution
                    ?.coordinatorName ||
                '';


            const searchable = [

                user.name,

                user.email,

                user.institution,

                coordinator

            ]
                .join(' ')
                .toLowerCase();


            return (

                (
                    S.plan === 'all' ||
                    user.plan === S.plan
                )

                &&

                (
                    S.institution === 'all' ||
                    user.institution ===
                        S.institution
                )

                &&

                (
                    !q ||
                    searchable.includes(q)
                )

            );

        });


    $('#ad-cnt').textContent =
        `${rows.length} of ${users.length} students`;


    $('#ad-rows').innerHTML =

        rows.length

            ? rows
                .map(user => {

                    const institution =
                        institutions.find(
                            i =>
                                i.name ===
                                user.institution
                        );


                    return `

                        <tr>

                            <td>

                                ${esc(user.name)}

                                <small>
                                    ${esc(user.email)}
                                </small>

                            </td>


                            <td>

                                ${esc(
                                    user.institution
                                )}

                                ${
                                    user.institutionVerified

                                        ? `
                                            <span
                                                class="ad-b ok"
                                            >
                                                Verified
                                            </span>
                                        `

                                        : ''
                                }

                            </td>


                            <td>

                                ${
                                    esc(
                                        institution
                                            ?.coordinatorName ||
                                        '—'
                                    )
                                }

                                <small>
                                    ${
                                        esc(
                                            institution
                                                ?.coordinatorEmail ||
                                            ''
                                        )
                                    }
                                </small>

                            </td>


                            <td>
                                ${planBadge(user.plan)}
                            </td>


                            <td>

                                <span
                                    class="ad-b ok"
                                >
                                    ${esc(user.status)}
                                </span>

                            </td>


                            <td class="n">
                                ${user.interviews}
                            </td>


                            <td class="n">
                                ${user.tokensUsed}
                            </td>


                            <td>
                                ${esc(user.lastActive)}
                            </td>

                        </tr>

                    `;

                })
                .join('')

            : `

                <tr>

                    <td
                        colspan="8"
                        class="ad-empty"
                    >
                        No students match
                        these filters.
                    </td>

                </tr>

            `;

}


/* =====================================================================
   USAGE VIEW
   ===================================================================== */

function usageView(users) {

    const cap =
        PA.PLANS.free.tokens;


    return `

        <h1>
            Usage
        </h1>

        <p class="ad-sub">
            Token usage per student
            against the Free allowance
            (${cap} tokens).
        </p>


        <div class="ad-kpis">

            ${kpi(
                sum(
                    users,
                    'interviews'
                ),
                'Interviews',
                'All students'
            )}

            ${kpi(
                sum(
                    users,
                    'questionsAnswered'
                ),
                'Questions answered',
                'All students'
            )}

            ${kpi(
                sum(
                    users,
                    'tokensUsed'
                ),
                'Tokens used',
                'All students'
            )}

            ${kpi(
                users.length
                    ? Math.round(
                        sum(
                            users,
                            'tokensUsed'
                        ) /
                        users.length
                    )
                    : 0,
                'Avg tokens / student',
                ''
            )}

        </div>


        <div class="card">

            ${
                [...users]

                    .sort(
                        (a,b) =>
                            b.tokensUsed -
                            a.tokensUsed
                    )

                    .map(
                        user => `

                            <div
                                class="ad-bar"
                                style="
                                    grid-template-columns:
                                    170px 1fr 48px
                                "
                            >

                                <span>
                                    ${esc(user.name)}
                                </span>


                                <div class="bar-track">

                                    <div
                                        class="bar-fill"
                                        style="
                                            width:
                                            ${
                                                Math.min(
                                                    100,
                                                    user.tokensUsed /
                                                    cap *
                                                    100
                                                )
                                            }%
                                        "
                                    ></div>

                                </div>


                                <span>
                                    ${user.tokensUsed}
                                </span>

                            </div>

                        `
                    )
                    .join('')
            }

        </div>

    `;

}


/* =====================================================================
   NAVIGATION
   ===================================================================== */

function nav() {

    return `

        <div class="ad-nav">

            <button
                data-view="overview"
                aria-current="${
                    S.view === 'overview'
                        ? 'page'
                        : 'false'
                }"
            >
                Overview
            </button>


            <button
                data-view="users"
                aria-current="${
                    S.view === 'users'
                        ? 'page'
                        : 'false'
                }"
            >
                Users
            </button>


            <button
                data-view="institutions"
                aria-current="${
                    S.view === 'institutions'
                        ? 'page'
                        : 'false'
                }"
            >
                Institutions
            </button>


            <button
                data-view="usage"
                aria-current="${
                    S.view === 'usage'
                        ? 'page'
                        : 'false'
                }"
            >
                Usage
            </button>

        </div>

    `;

}


/* =====================================================================
   HEADER
   ===================================================================== */

function header() {

    return `

        <div class="ad-top">

            <div>

                <strong
                    style="
                        font:700 18px 'Space Grotesk';
                    "
                >
                    PrepArena
                </strong>

                <span class="lbl">
                    ADMIN CONSOLE
                </span>

            </div>


            <div class="ad-right">

                <div
                    style="
                        text-align:right;
                    "
                >

                    <strong>
                        Rehan
                    </strong>

                    <small
                        style="
                            display:block;
                            color:var(--text-dim);
                            font-size:11px;
                        "
                    >
                        Administrator
                    </small>

                </div>


                <div class="ad-av">
                    R
                </div>


                <button
                    class="btn-secondary"
                    id="ad-logout"
                    type="button"
                >
                    Logout
                </button>

            </div>

        </div>

    `;

}


/* =====================================================================
   MAIN RENDER
   ===================================================================== */

function render() {

    const users =
        getAdminUsers();

    const institutions =
        getInstitutions(users);


    root.innerHTML =

        header() +

        nav() +

        `<main class="ad-main"></main>`;


    const main =
        root.querySelector(
            '.ad-main'
        );


    if (S.view === 'overview') {

        main.innerHTML =
            overviewView(
                users,
                institutions
            );

    }

    else if (
        S.view === 'users'
    ) {

        main.innerHTML =
            usersView();


        fillFilters(
            users,
            institutions
        );


        drawTable(
            users
        );

    }

    else if (
        S.view === 'institutions'
    ) {

        main.innerHTML =
            institutionsView(
                users
            );

    }

    else if (
        S.view === 'usage'
    ) {

        main.innerHTML =
            usageView(
                users
            );

    }


    /*
       Navigation
    */

    root
        .querySelectorAll(
            '.ad-nav button'
        )
        .forEach(button => {

            button.onclick =
                () => {

                    S.view =
                        button.dataset.view;

                    S.inst = null;

                    render();

                };

        });


    /*
       Logout
    */

    const logout =
        $('#ad-logout');

    if (logout) {

        logout.onclick =
            logoutAdmin;

    }


    /*
       Add institution
    */

    const addButton =
        $('#ad-add-institution');

    if (addButton) {

        addButton.onclick =
            () =>
                showInstitutionModal();

    }


    /*
       Institution cards
    */

    root
        .querySelectorAll(
            '.ad-inst[data-inst]'
        )
        .forEach(button => {

            button.onclick =
                () => {

                    S.inst =
                        button.dataset.inst;

                    render();

                };

        });


    /*
       Institution detail buttons
    */

    const back =
        $('#ad-back-institutions');

    if (back) {

        back.onclick =
            () => {

                S.inst = null;

                render();

            };

    }


    const edit =
        $('#ad-edit-institution');

    if (edit) {

        const institution =
            getInstitutions(users)
                .find(
                    i =>
                        i.name ===
                        S.inst
                );

        if (institution) {

            edit.onclick =
                () =>
                    showInstitutionModal(
                        institution
                    );

        }

    }

}


/* =====================================================================
   OPEN / CLOSE ADMIN
   ===================================================================== */

function open() {

    const authenticated =
        sessionStorage.getItem(
            ADMIN_SESSION_KEY
        ) === 'true';


    if (!authenticated) {

        showAdminLogin();

        return;

    }


    root.classList.add('on');

    render();

}


function close() {

    root.classList.remove('on');

}


function logoutAdmin() {

    sessionStorage.removeItem(
        ADMIN_SESSION_KEY
    );

    close();

    showAdminLogin();

}


/* =====================================================================
   ACCOUNT MENU
   ===================================================================== */

function addMenuItem() {

    const menu =
        document.querySelector(
            '#pa-user .pa-menu'
        );


    if (
        !menu ||
        menu.querySelector(
            '[data-admin]'
        )
    ) {

        return;

    }


    const button =
        Object.assign(
            document.createElement('button'),
            {
                textContent:
                    'Admin Dashboard'
            }
        );


    button.setAttribute(
        'data-admin',
        ''
    );


    button.addEventListener(
        'click',
        open
    );


    menu.insertBefore(
        button,
        menu.lastElementChild
    );

}


new MutationObserver(
    addMenuItem
).observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


addMenuItem();


/* =====================================================================
   HASH ROUTING
   ===================================================================== */

window.addEventListener(
    'hashchange',
    () => {

        if (
            location.hash ===
            '#admin'
        ) {

            open();

        }

    }
);


if (
    location.hash ===
    '#admin'
) {

    open();

}


/* =====================================================================
   ESCAPE KEY
   ===================================================================== */

document.addEventListener(
    'keydown',
    e => {

        if (
            e.key === 'Escape' &&
            root.classList.contains('on')
        ) {

            close();

        }

    }
);


/* =====================================================================
   PUBLIC API
   ===================================================================== */

window.PrepArenaAdmin = {

    open,

    close,

    logout:
        logoutAdmin,

    getAdminUsers,

    getInstitutions,

    showInstitutionModal

};


})();