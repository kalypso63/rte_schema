/**
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */
/*
 * Schema Attr Plugin for TYPO3 htmlArea RTE
 */

define('TYPO3/CMS/Rtehtmlarea/Plugins/SchemaAttr',
    ['TYPO3/CMS/Rtehtmlarea/HTMLArea/Plugin/Plugin',
     'TYPO3/CMS/Rtehtmlarea/HTMLArea/Util/Util'],

function (Plugin, Util) {
    var SchemaAttr = function (editor, pluginName) {
        this.constructor.super.call(this, editor, pluginName);
    };
    Util.inherit(SchemaAttr, Plugin);
    Util.apply(SchemaAttr.prototype, {
        /*
         * This function gets called by the class constructor
         */
        configurePlugin: function (editor) {
            this.pageTSConfiguration = this.editorConfiguration.buttons.schemaattr;
            this.allowTags = (this.pageTSConfiguration && this.pageTSConfiguration.allowTags) ? this.pageTSConfiguration.allowTags : null;
            this.allowSchemaType = (this.pageTSConfiguration && this.pageTSConfiguration.allowSchemaType) ? this.pageTSConfiguration.allowSchemaType : null;
            this.quotes = new RegExp('^\w+\s*([a-zA-Z_0-9:;]+=\"[^\"]*\"\s*|[a-zA-Z_0-9:;]+=\'[^\']*\'\s*)*$');
            /*
             * Registering plugin "About" information
             */
            var pluginInformation = {
                version		: '1.0',
                developer	: 'VANCLOOSTER Mickael',
                developerUrl	: '',
                copyrightOwner	: '',
                sponsor		: '',
                sponsorUrl	: '',
                license		: 'GPL'
            };
            this.registerPluginInformation(pluginInformation);
            /*
             * Registering the button
             */
            var buttonId = 'SchemaAttr';
            var buttonConfiguration = {
                id		: buttonId,
                tooltip		: this.localize('schematitle'),
                iconCls		: 'htmlarea-action-schemaattr-insert',
                action		: 'onButtonPress',
                selection	: true,
                dialog		: true
            };
            this.registerButton(buttonConfiguration);
            return true;
        },

        /*
         * This function gets called when the button was pressed.
         *
         * @param	object		editor: the editor instance
         * @param	string		id: the button id or the key
         * @param	object		target: the target element of the contextmenu event, when invoked from the context menu
         *
         * @return	boolean		false if action is completed
         */
        onButtonPress: function (editor, id, target) {
            // Could be a button or its hotkey
            var buttonId = this.translateHotKey(id);
            buttonId = buttonId ? buttonId : id;
            this.openDialogue(
                'schematitle',
                {
                    buttonId: buttonId
                },
                this.getWindowDimensions({ width: 570}, buttonId),
                this.buildItemsConfig(),
                this.setTag
            );
            this.insertedTag = this.dialog.find('itemId', 'insertedTag')[0];
            this.tagCombo = this.dialog.find('itemId', 'tags')[0];
            this.typeCombo = this.dialog.find('itemId', 'types')[0];
            this.attrTypeCombo = this.dialog.find('itemId', 'attrTypes')[0];
            this.attrPropertyCombo = this.dialog.find('itemId', 'attrProperties')[0];
            //fill if already set
            //this.getSelectionNode();
        },
        /*
         * Build the window items config
         */
        buildItemsConfig: function (element, buttonId) {
            this.tagStore = new Ext.data.ArrayStore({
                autoDestroy:  true,
                storeId: 'tagStore',
                autoLoad: true,
                fields: [ { name: 'text'}, { name: 'value'}],
                data: this.tags
            });
            if (this.allowTags) {
                var allowTags = new RegExp('^(' + this.allowTags.split(',').join('|').replace(/ /g, '') + ')$', 'i');
                this.tagStore.filterBy(function (record) {
                    return allowTags.test(record.get('value'));
                });
                // Make sure the combo list is filtered
                this.tagStore.snapshot = this.tagStore.data;
            }

            this.typesStore = new Ext.data.ArrayStore({
                autoDestroy: true,
                autoLoad: true,
                fields: [{ name: 'text'}, { name: 'value'}],
                data: this.types
            });

            this.attrTypesStore = new Ext.data.JsonStore({
                autoDestroy: true,
                url: this.editorConfiguration.schemaUrl,
                storeId: 'attrTypesStore',
                autoLoad: true,
                root: 'types',
                fields: [ { name: 'domain'}, { name: 'name'},  { name: 'comment'}, { name: 'subdomains'}]
            });

            this.attrPropertiesStore = new Ext.data.JsonStore({
                autoDestroy: true,
                url: this.editorConfiguration.schemaUrl,
                storeId: 'attrPropertiesStore',
                autoLoad: true,
                root: 'properties',
                fields: [ { name: 'domains'}, { name: 'name'},  { name: 'comment'}]
            });


            var itemsConfig = [
                {
                    xtype: 'textarea',
                    width: 500,
                    itemId: 'insertedTag',
                    fieldLabel: '<',
                    labelSeparator: '',
                    grow: true
                }
                ,{
                    xtype: 'displayfield',
                    text: '>'
                }
                ,{
                    xtype: 'combo',
                    itemId: 'tags',
                    editable: false,
                    typeAhead: false,
                    mode: 'local',
                    lazyRender:true,
                    valueField: 'value',
                    displayField: 'text',
                    helpIcon: true,
                    fieldLabel: this.localize('Tags'),
                    emptyText: this.localize('SelectTag'),
                    store: this.tagStore,
                    listeners: {
                        select: {
                            fn: this.onTagSelect,
                            scope: this
                        }
                    }
                }
                ,{
                    xtype: 'combo',
                    itemId: 'types',
                    editable: false,
                    typeAhead: false,
                    mode: 'local',
                    lazyRender:true,
                    valueField: 'value',
                    displayField: 'text',
                    helpIcon: true,
                    fieldLabel: this.localize('Types'),
                    emptyText: this.localize('SelectType'),
                    store: this.typesStore,
                    hidden: true,
                    listeners: {
                        select: {
                            fn: this.onTypeSelect,
                            scope: this
                        }
                    }
                }
                ,{
                    xtype: 'combo',
                    itemId: 'attrTypes',
                    fieldLabel: this.localize('AttrTypes'),
                    typeAhead: true,
                    enableKeyEvents: true,
                    triggerAction: 'all',
                    forceSelection: true,
                    multiSelect: false,
                    lazyRender:true,
                    mode: 'local',
                    valueField: 'domain',
                    displayField: 'name',
                    hidden : true,
                    emptyText: this.localize('SelectSchema'),
                    store : this.attrTypesStore,
                    listeners: {
                        select: {
                            fn: this.onAttrTypeSelect,
                            scope: this
                        },
                        keypress: {
                            fn: this.onAttrTypeSelect,
                            scope: this
                        }
                    }
                }
                ,{
                    xtype: 'combo',
                    itemId: 'attrProperties',
                    fieldLabel: this.localize('AttrProperties'),
                    typeAhead: true,
                    triggerAction: 'all',
                    forceSelection: true,
                    multiSelect: false,
                    lazyRender:true,
                    mode: 'local',
                    valueField: 'name',
                    displayField: 'name',
                    hidden : true,
                    emptyText: this.localize('SelectProperty'),
                    store : this.attrPropertiesStore,
                    listeners: {
                        select: {
                            fn: this.onAttrPropertiesSelect,
                            scope: this
                        },
                        expand : {
                            fn : this.filterProperties,
                            scope: this
                        }
                    }
                }
            ];
            return {
                xtype: 'fieldset',
                title: this.localize('Schema attr'),
                defaultType: 'textfield',
                labelWidth: 100,
                defaults: {
                    helpIcon: true
                },
                items: itemsConfig
            };
        },
        /*
         * Handler invoked when a OK button is pressed
         */
        setTag: function (button, event) {
            this.restoreSelection();
            var insertedTag = this.insertedTag.getValue();
            if (!insertedTag) {
                TYPO3.Dialog.InformationDialog({
                    title: this.getButton('SchemaAttr').tooltip.title,
                    msg: this.localize('Enter the TAG you want to insert'),
                    fn: function () { this.insertedTag.focus(); },
                    scope: this
                });
                event.stopEvent();
                return false;
            }
            if (this.quotes.test(insertedTag)) {
                if (this.quotes.test(insertedTag + '"')) {
                    TYPO3.Dialog.InformationDialog({
                        title: this.getButton('SchemaAttr').tooltip.title,
                        msg: this.localize('There are some unclosed quote'),
                        fn: function () { this.insertedTag.focus(); this.insertedTag.select(); },
                        scope: this
                    });
                    event.stopEvent();
                    return false;
                } else {
                    this.insertedTag.setValue(insertedTag + '"');
                }
            }
            insertedTag = insertedTag.replace(/(<|>)/g, '');
            var tagOpen = '<' + insertedTag + '>';
            var tagClose = tagOpen.replace(/^<(\w+) ?.*>/, '</$1>');
            this.editor.getSelection().surroundHtml(tagOpen, tagClose);
            this.close();
            event.stopEvent();
        },
        getSelectionNode : function(){
            if(this.editor.getSelection().getFullySelectedNode()){
                var ancestor = this.editor.getSelection().getAllAncestors()[0];
                var insertTag = ancestor.localName;
                /*this.tagStore.load(function(st){
                 this.tagCombo.select(this.tagCombo.getStore().getAt(0));
                 });*/
                var attributes = ancestor.attributes;
                for (var i = 0; i < attributes.length; i += 1) {
                    insertTag += ' ' + attributes[i].localName + '="' + attributes[i].nodeValue + '" ';
                }

                this.insertedTag.setValue(insertTag);
                this.insertedTag.focus(false, 50);
            }
        },
        /*
         * Handler invoked when a tag is selected
         * Update the attributes combo and the inserted tag field
         */
        onTagSelect: function (tagCombo, tagRecord) {
            var tag = tagRecord.get('value');
            this.typeCombo.clearValue();
            this.typeCombo.show();
            this.insertedTag.setValue(tag);
            this.insertedTag.focus(false, 50);
        },
        /*
         * Handler invoked when an type is selected
         * Update the values combo and the inserted tag field
         */
        onTypeSelect: function (typeCombo, typeRecord) {
            var insertedTag = this.insertedTag.getValue();
            //this.filterSchemas();
            this.attrTypeCombo.clearValue();
            this.attrTypeCombo.show();
            var attribute = typeRecord.get('text');
            this.insertedTag.setValue(insertedTag + ((/\"/.test(insertedTag) && (!/\"$/.test(insertedTag) || /=\"$/.test(insertedTag))) ? '" ' : ' ') + typeRecord.get('value'));
            this.insertedTag.focus(false, 50);
        },
        /*
         * Handler invoked when an type is selected
         * Update the values combo and the inserted tag field
         */
        onAttrTypeSelect: function (attrTypeCombo, attrTypeRecord) {
            var switchType = this.typeCombo.lastSelectionText;
            if(switchType === 'Itemtype'){
                var insertedTag = this.insertedTag.getValue();
                var attribute = attrTypeRecord.get('domain');
                insertedTag = insertedTag.replace(/itemtype=['"](.*)['"]/i, 'itemtype="'+ attribute + '"');
                this.insertedTag.setValue(insertedTag);
                this.insertedTag.focus(false, 50);
            }else{
                this.attrPropertyCombo.clearValue();
                this.filterProperties();
                this.attrPropertyCombo.show();
            }
        },
        filterSchemas : function(){
            if (this.allowSchemaType) {
                var allowSchemas = new RegExp('^(' + this.allowSchemaType.split(',').join('|').replace(/ /g, '') + ')$', 'i');
                if(this.attrTypesStore.isFiltered())
                    this.attrTypesStore.clearFilter(true);
                this.attrTypesStore.filterBy(function (record) {
                    return allowSchemas.test(record.get('name'));
                });
                // Make sure the combo list is filtered
                this.attrTypesStore.snapshot = this.attrTypesStore.data;
            }
        },
        filterProperties : function(){
            var domain = this.attrTypeCombo.value;
            var search = domain.toString();
            var allDomains = [];
            if(search){
                //get all schema
                allDomains = this.getAllSchemas(allDomains,search,true);
                if(allDomains){
                    if(this.attrPropertyCombo.getStore().isFiltered())
                        this.attrPropertyCombo.getStore().clearFilter(true);

                    this.attrPropertyCombo.getStore().filterBy(function(record, id) {
                        var i, j = null;
                        var domains = record.get('domains');
                        for (i = 0; domains.length > i; i += 1) {
                            for (j = 0; allDomains.length > j; j += 1) {
                                if (domains[i] === allDomains[j])
                                    return true
                            }
                        }
                        return false;
                    });
                }
            }
        },
        getAllSchemas : function (allDomains, domain, first){
            this.attrTypesStore.clearFilter(true);
            if(first)
                allDomains.push(domain);

            var index = this.attrTypesStore.find('domain', domain);
            var schemaData = this.attrTypesStore.getAt(index);
            if(schemaData){
                if(schemaData.data.subdomains){
                    for (i = 0; schemaData.data.subdomains.length > i; i += 1) {
                        var subdomain = schemaData.data.subdomains[i].toString();
                        allDomains.push(subdomain);
                        allDomains = this.getAllSchemas(allDomains, subdomain, false);
                    }
                }
            }
            return allDomains;
        },
        /*
         * Handler invoked when an type is selected
         * Update the values combo and the inserted tag field
         */
        onAttrPropertiesSelect: function (attrPropertiesCombo, attrPropertiesRecord) {
            var insertedTag = this.insertedTag.getValue();
            var attribute = attrPropertiesRecord.get('name');
            insertedTag = insertedTag.replace(/itemprop=['"](.*)['"]/i, 'itemprop="'+ attribute + '"');
            this.insertedTag.setValue(insertedTag);
            this.insertedTag.focus(false, 50);
        },
        /*
         * Open the dialogue window
         *
         * @param	string		title: the window title
         * @param	object		arguments: some arguments for the handler
         * @param	integer		dimensions: the opening dimensions of the window
         * @param	object		items: the configuration of the window items
         * @param	function	handler: handler when the OK button if clicked
         *
         * @return	void
         */
        openDialogue: function (title, arguments, dimensions, items, handler) {
            if (this.dialog) {
                this.dialog.close();
            }
            this.dialog = new Ext.Window({
                title: this.localize(title),
                arguments: arguments,
                cls: 'htmlarea-window',
                border: false,
                width: dimensions.width,
                height: 'auto',
                iconCls: this.getButton(arguments.buttonId).iconCls,
                listeners: {
                    close: {
                        fn: this.onClose,
                        scope: this
                    }
                },
                items: {
                    xtype: 'container',
                    layout: 'form',
                    defaults: {
                        labelWidth: 150
                    },
                    items: items
                },
                buttons: [
                    this.buildButtonConfig('OK', handler),
                    this.buildButtonConfig('Cancel', this.onCancel)
                ]
            });
            this.show();
        },
        tags: [
            ['a', 'a'],
            ['abbr', 'abbr'],
            ['acronym', 'acronym'],
            ['address', 'address'],
            ['b', 'b'],
            ['big', 'big'],
            ['blockquote', 'blockquote'],
            ['cite', 'cite'],
            ['code', 'code'],
            ['div', 'div'],
            ['em', 'em'],
            ['fieldset', 'fieldset'],
            ['font', 'font'],
            ['h1', 'h1'],
            ['h2', 'h2'],
            ['h3', 'h3'],
            ['h4', 'h4'],
            ['h5', 'h5'],
            ['h6', 'h6'],
            ['i', 'i'],
            ['legend', 'legend'],
            ['li', 'li'],
            ['ol', 'ol'],
            ['ul', 'ul'],
            ['p', 'p'],
            ['pre', 'pre'],
            ['q', 'q'],
            ['small', 'small'],
            ['span', 'span'],
            ['strike', 'strike'],
            ['strong', 'strong'],
            ['sub', 'sub'],
            ['sup', 'sup'],
            ['table', 'table'],
            ['tt', 'tt'],
            ['u', 'u']
        ],
        types : [
            ['Itemtype', 'itemscope itemtype=""'],
            ['Itemprop', 'itemprop=""']
        ]
    });

    return SchemaAttr;

});
