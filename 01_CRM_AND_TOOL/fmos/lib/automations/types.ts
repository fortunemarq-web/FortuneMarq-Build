export interface Condition {
    field: string;
    op: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'gte' | 'lte' | 'is_null' | 'not_null' | 'between';
    value?: any;
}

export interface ConditionGroup {
    all?: Condition[];
    any?: Condition[];
}

export interface Action {
    type:
    | 'assign_owner'
    | 'set_next_action_date'
    | 'set_status'
    | 'add_tag'
    | 'remove_tag'
    | 'create_task'
    | 'mark_stale'
    | 'notify_admin'
    | 'notify_owner'
    | 'send_whatsapp';
    /**
     * For `send_whatsapp` this is a WaTemplateConfig (lib/whatsapp/params.ts):
     * { audience, template | leadTypeTemplates, lang?, params? | headline/detail/link }.
     */
    value: any;
}

export interface AutomationRule {
    id: string;
    name: string;
    entity_type: string;
    trigger: string;
    conditions: ConditionGroup;
    actions: Action[];
    priority: number;
    throttle_minutes: number;
    is_enabled: boolean;
}
