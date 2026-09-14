"""Generates a downloadable Salesforce (SFDX) metadata package that mirrors this
prototype: a Screen Flow, two LWCs (search datatable + hierarchy tree), an Apex
controller, and project scaffolding. Content is illustrative reference code."""
import io
import zipfile

API_VERSION = "61.0"

FILES = {}

FILES["README.md"] = """# MeridianOne — Commercial Banking Relationship Creation (Salesforce Package)

Deployable reference scaffolding that mirrors the MeridianOne web prototype:
a **Screen Flow** that launches an LWC-driven, 4-step relationship-creation experience.

## Assumptions / data model
This package assumes the 4 levels are modelled on the standard **Account** object using:
- `Relationship_Level__c` — picklist: `L1`, `L2`, `L3`, `L4`
- `Relationship_ID__c` — external id text (e.g. `REL-100045`)
- `Parent_Relationship__c` — Lookup(Account) self-relationship (parent roll-up)
- `Credit_Rating__c`, `KYC_Status__c`, `Segment__c`, `Total_Exposure__c` — supporting fields

Adjust `RelationshipSearchController` SOQL/field names to match your org, or repoint
the LWCs at custom objects if your levels are separate sObjects.

## Contents
- `flows/New_Relationship_Creation.flow-meta.xml` — Screen Flow (Select Level -> Search -> Results -> Create/Launch)
- `lwc/relationshipSearch` — search form (5 filters) + `lightning-datatable` results with preview/launch row actions
- `lwc/relationshipHierarchyTree` — L1->L2->L3->L4 roll-up tree using `lightning-tree-grid`
- `classes/RelationshipSearchController` — `@AuraEnabled` search + hierarchy Apex

## Deploy
```bash
sf project deploy start -d force-app -o <your-org-alias>
```
Then add the **New Relationship Creation** flow to a Lightning page or App Launcher action.
"""

FILES["sfdx-project.json"] = """{
  "packageDirectories": [{ "path": "force-app", "default": true }],
  "name": "meridianone-relationships",
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "%s"
}
""" % API_VERSION

FILES["manifest/package.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types><members>relationshipSearch</members><members>relationshipHierarchyTree</members><name>LightningComponentBundle</name></types>
    <types><members>RelationshipSearchController</members><name>ApexClass</name></types>
    <types><members>New_Relationship_Creation</members><name>Flow</name></types>
    <version>%s</version>
</Package>
""" % API_VERSION

# ---------------------------------------------------------------------------
# Apex controller
# ---------------------------------------------------------------------------
FILES["force-app/main/default/classes/RelationshipSearchController.cls"] = """public with sharing class RelationshipSearchController {

    public class RelationshipDTO {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String name;
        @AuraEnabled public String level;
        @AuraEnabled public String relationshipId;
        @AuraEnabled public String country;
        @AuraEnabled public String industry;
        @AuraEnabled public String status;
        @AuraEnabled public String parentName;
        @AuraEnabled public String keyDetail;
        @AuraEnabled public List<RelationshipDTO> children;
    }

    // Step 2/3: search existing relationships across all levels (duplicate check).
    @AuraEnabled(cacheable=true)
    public static List<RelationshipDTO> searchRelationships(
        String name, String relationshipId, String country, String industry, String status, String level
    ) {
        String soql = 'SELECT Id, Name, Relationship_Level__c, Relationship_ID__c, ' +
            'BillingCountry, Industry, Type, Credit_Rating__c, Parent_Relationship__r.Name ' +
            'FROM Account WHERE Id != null';
        List<String> clauses = new List<String>();
        Map<String, Object> binds = new Map<String, Object>();
        if (String.isNotBlank(name))           { clauses.add('Name LIKE :nameBind');       binds.put('nameBind', '%' + name + '%'); }
        if (String.isNotBlank(relationshipId)) { clauses.add('Relationship_ID__c LIKE :ridBind'); binds.put('ridBind', '%' + relationshipId + '%'); }
        if (String.isNotBlank(country))        { clauses.add('BillingCountry = :countryBind'); binds.put('countryBind', country); }
        if (String.isNotBlank(industry))       { clauses.add('Industry = :industryBind');   binds.put('industryBind', industry); }
        if (String.isNotBlank(status))         { clauses.add('Type = :statusBind');         binds.put('statusBind', status); }
        if (String.isNotBlank(level))          { clauses.add('Relationship_Level__c = :levelBind'); binds.put('levelBind', level); }
        if (!clauses.isEmpty()) { soql += ' AND ' + String.join(clauses, ' AND '); }
        soql += ' ORDER BY Relationship_Level__c, Name LIMIT 500';

        List<RelationshipDTO> out = new List<RelationshipDTO>();
        for (Account a : (List<Account>) Database.queryWithBinds(soql, binds, AccessLevel.USER_MODE)) {
            out.add(toDTO(a));
        }
        return out;
    }

    // Record view: full L1->L4 roll-up tree for a given account.
    @AuraEnabled(cacheable=true)
    public static RelationshipDTO getHierarchy(Id recordId) {
        Account current = queryAccount(recordId);
        Account root = current;
        Integer guard = 0;
        while (root.Parent_Relationship__c != null && guard++ < 10) {
            root = queryAccount(root.Parent_Relationship__c);
        }
        return buildTree(root.Id);
    }

    private static RelationshipDTO buildTree(Id nodeId) {
        RelationshipDTO node = toDTO(queryAccount(nodeId));
        node.children = new List<RelationshipDTO>();
        for (Account child : [
            SELECT Id, Name, Relationship_Level__c, Relationship_ID__c, BillingCountry,
                   Industry, Type, Credit_Rating__c, Parent_Relationship__r.Name
            FROM Account WHERE Parent_Relationship__c = :nodeId WITH USER_MODE
            ORDER BY Relationship_Level__c, Name
        ]) {
            node.children.add(buildTree(child.Id));
        }
        return node;
    }

    private static Account queryAccount(Id recordId) {
        return [
            SELECT Id, Name, Relationship_Level__c, Relationship_ID__c, BillingCountry,
                   Industry, Type, Credit_Rating__c, Parent_Relationship__c,
                   Parent_Relationship__r.Name
            FROM Account WHERE Id = :recordId WITH USER_MODE LIMIT 1
        ];
    }

    private static RelationshipDTO toDTO(Account a) {
        RelationshipDTO d = new RelationshipDTO();
        d.recordId = a.Id;
        d.name = a.Name;
        d.level = a.Relationship_Level__c;
        d.relationshipId = a.Relationship_ID__c;
        d.country = a.BillingCountry;
        d.industry = a.Industry;
        d.status = a.Type;
        d.parentName = a.Parent_Relationship__r != null ? a.Parent_Relationship__r.Name : null;
        d.keyDetail = a.Credit_Rating__c;
        return d;
    }
}
"""

FILES["force-app/main/default/classes/RelationshipSearchController.cls-meta.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>%s</apiVersion>
    <status>Active</status>
</ApexClass>
""" % API_VERSION

# ---------------------------------------------------------------------------
# LWC: relationshipSearch
# ---------------------------------------------------------------------------
FILES["force-app/main/default/lwc/relationshipSearch/relationshipSearch.js"] = """import { LightningElement, track, wire } from 'lwc';
import searchRelationships from '@salesforce/apex/RelationshipSearchController.searchRelationships';

const COLUMNS = [
    { label: 'Level', fieldName: 'level', fixedWidth: 80 },
    { label: 'Name', fieldName: 'name' },
    { label: 'Relationship ID', fieldName: 'relationshipId' },
    { label: 'Country', fieldName: 'country' },
    { label: 'Industry', fieldName: 'industry' },
    { label: 'Status', fieldName: 'status' },
    { label: 'Parent', fieldName: 'parentName' },
    { label: 'Key Detail', fieldName: 'keyDetail' },
    { type: 'action', typeAttributes: { rowActions: [
        { label: 'Preview', name: 'preview' },
        { label: 'Launch', name: 'launch' }
    ] } }
];

export default class RelationshipSearch extends LightningElement {
    columns = COLUMNS;
    @track filters = { name: '', relationshipId: '', country: '', industry: '', status: '' };
    @track results = [];
    level;

    handleChange(event) {
        this.filters = { ...this.filters, [event.target.name]: event.detail.value };
    }

    @wire(searchRelationships, {
        name: '$filters.name', relationshipId: '$filters.relationshipId',
        country: '$filters.country', industry: '$filters.industry',
        status: '$filters.status', level: '$level'
    })
    wiredResults({ data }) { if (data) { this.results = data; } }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;
        this.dispatchEvent(new CustomEvent(action, { detail: row }));
    }
}
"""

FILES["force-app/main/default/lwc/relationshipSearch/relationshipSearch.html"] = """<template>
    <lightning-card title="Search &amp; Validate" icon-name="standard:account">
        <div class="slds-grid slds-wrap slds-gutters slds-p-horizontal_medium">
            <lightning-input class="slds-col slds-size_1-of-3" name="name" label="Relationship / Account Name" onchange={handleChange}></lightning-input>
            <lightning-input class="slds-col slds-size_1-of-3" name="relationshipId" label="Relationship ID" onchange={handleChange}></lightning-input>
            <lightning-combobox class="slds-col slds-size_1-of-3" name="country" label="Country / Region" options={countryOptions} onchange={handleChange}></lightning-combobox>
            <lightning-combobox class="slds-col slds-size_1-of-3" name="industry" label="Industry" options={industryOptions} onchange={handleChange}></lightning-combobox>
            <lightning-combobox class="slds-col slds-size_1-of-3" name="status" label="Status" options={statusOptions} onchange={handleChange}></lightning-combobox>
        </div>
        <div class="slds-p-around_medium">
            <lightning-datatable key-field="recordId" data={results} columns={columns}
                onrowaction={handleRowAction} hide-checkbox-column></lightning-datatable>
        </div>
    </lightning-card>
</template>
"""

FILES["force-app/main/default/lwc/relationshipSearch/relationshipSearch.js-meta.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>%s</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__FlowScreen</target>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle>
""" % API_VERSION

# ---------------------------------------------------------------------------
# LWC: relationshipHierarchyTree
# ---------------------------------------------------------------------------
FILES["force-app/main/default/lwc/relationshipHierarchyTree/relationshipHierarchyTree.js"] = """import { LightningElement, api, wire, track } from 'lwc';
import getHierarchy from '@salesforce/apex/RelationshipSearchController.getHierarchy';

const COLUMNS = [
    { type: 'text', fieldName: 'name', label: 'Relationship / Entity' },
    { type: 'text', fieldName: 'level', label: 'Level', initialWidth: 90 },
    { type: 'text', fieldName: 'relationshipId', label: 'ID' },
    { type: 'text', fieldName: 'status', label: 'Status' }
];

export default class RelationshipHierarchyTree extends LightningElement {
    @api recordId;
    gridColumns = COLUMNS;
    @track treeData = [];

    @wire(getHierarchy, { recordId: '$recordId' })
    wiredTree({ data }) {
        if (data) { this.treeData = [this.toGrid(data)]; }
    }

    toGrid(node) {
        return {
            name: node.name, level: node.level, relationshipId: node.relationshipId,
            status: node.status, _children: (node.children || []).map((c) => this.toGrid(c))
        };
    }
}
"""

FILES["force-app/main/default/lwc/relationshipHierarchyTree/relationshipHierarchyTree.html"] = """<template>
    <lightning-card title="Enterprise Hierarchy" icon-name="standard:hierarchy">
        <div class="slds-p-around_small">
            <lightning-tree-grid columns={gridColumns} data={treeData}
                key-field="relationshipId" hide-checkbox-column></lightning-tree-grid>
        </div>
    </lightning-card>
</template>
"""

FILES["force-app/main/default/lwc/relationshipHierarchyTree/relationshipHierarchyTree.js-meta.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>%s</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__RecordPage</target>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle>
""" % API_VERSION

# ---------------------------------------------------------------------------
# Screen Flow
# ---------------------------------------------------------------------------
FILES["force-app/main/default/flows/New_Relationship_Creation.flow-meta.xml"] = """<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>%s</apiVersion>
    <label>New Relationship Creation</label>
    <processType>Flow</processType>
    <status>Active</status>
    <interviewLabel>New Relationship Creation {!$Flow.CurrentDateTime}</interviewLabel>

    <choices>
        <name>Choice_L1</name><choiceText>L1 - Primary Relationship</choiceText>
        <dataType>String</dataType><value><stringValue>L1</stringValue></value>
    </choices>
    <choices>
        <name>Choice_L2</name><choiceText>L2 - Intermediate Relationship</choiceText>
        <dataType>String</dataType><value><stringValue>L2</stringValue></value>
    </choices>

    <variables>
        <name>selectedLevel</name><dataType>String</dataType>
        <isInput>false</isInput><isOutput>false</isOutput>
    </variables>

    <!-- Screen 1: Select level -->
    <screens>
        <name>Select_Level</name><label>Step 1 - Select Level</label>
        <allowBack>false</allowBack><allowFinish>false</allowFinish><allowPause>false</allowPause>
        <fields>
            <name>LevelPicker</name><choiceReferences>Choice_L1</choiceReferences>
            <choiceReferences>Choice_L2</choiceReferences>
            <dataType>String</dataType><fieldText>Which level do you want to create?</fieldText>
            <fieldType>RadioButtons</fieldType><isRequired>true</isRequired>
        </fields>
        <connector><targetReference>Search_Screen</targetReference></connector>
    </screens>

    <!-- Screen 2/3: Search + results datatable (LWC) -->
    <screens>
        <name>Search_Screen</name><label>Step 2 - Search &amp; Validate</label>
        <allowBack>true</allowBack><allowFinish>false</allowFinish><allowPause>false</allowPause>
        <fields>
            <name>SearchComponent</name>
            <extensionName>c:relationshipSearch</extensionName>
            <fieldType>ComponentInstance</fieldType>
            <inputParameters>
                <name>level</name><value><elementReference>LevelPicker</elementReference></value>
            </inputParameters>
        </fields>
        <connector><targetReference>Create_Screen</targetReference></connector>
    </screens>

    <!-- Screen 4: Create new record -->
    <screens>
        <name>Create_Screen</name><label>Step 4 - Create Relationship</label>
        <allowBack>true</allowBack><allowFinish>true</allowFinish><allowPause>false</allowPause>
        <fields>
            <name>NewAccount</name>
            <fieldType>ObjectProvided</fieldType>
            <objectFieldReference>Account</objectFieldReference>
        </fields>
    </screens>

    <startElementReference>Select_Level</startElementReference>
</Flow>
""" % API_VERSION


def build_zip() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, content in FILES.items():
            zf.writestr("meridianone-salesforce-package/" + path, content)
    buf.seek(0)
    return buf.getvalue()
