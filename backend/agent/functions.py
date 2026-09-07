"""Function (tool) schemas for the demo voice agent.

Only two functions — place_order and end_conversation — mirroring the
production repo but scoped to the conversation-only demo (no transfer_call,
and no phone number is collected).
"""

from deepgram.types.think_settings_v1 import ThinkSettingsV1FunctionsItem


def build_functions():
    """Return the list of ThinkSettingsV1FunctionsItem sent to the LLM."""
    place_order = ThinkSettingsV1FunctionsItem(
        name='place_order',
        description=(
            "Record the customer's fully confirmed order. Call FIRST, before any "
            'text, in the response immediately after the order is complete: '
            '(1) every item confirmed with quantity, spice level, protein '
            'choice, and paid add-ons; (2) the full order read back with '
            'prices; (3) the customer\'s name; (4) the total and the 20-25 '
            'minute ETA given. Output no text before this call. After '
            'place_order, speak a short goodbye, then call end_conversation.'
        ),
        parameters={
            'type': 'object',
            'properties': {
                'customer_name': {
                    'type': 'string',
                    'description': "Customer's name as they gave it (first name is sufficient).",
                },
                'items': {
                    'type': 'array',
                    'description': 'Every item in the confirmed order using exact menu names.',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'name': {
                                'type': 'string',
                                'description': 'Exact menu item name as listed on the menu.',
                            },
                            'quantity': {
                                'type': 'integer',
                                'description': 'Number of this item.',
                                'minimum': 1,
                            },
                            'price': {
                                'type': 'number',
                                'description': (
                                    'Unit price in USD including paid add-ons '
                                    '(free choices do not change price).'
                                ),
                            },
                            'notes': {
                                'type': 'string',
                                'description': (
                                    "Free-text special requests or requests that "
                                    "aren't a listed option (e.g. 'no vegetables', "
                                    "'extra sauce on the side'). Put the spice "
                                    "level and chosen protein in 'modifiers' "
                                    'instead, not here.'
                                ),
                            },
                            'modifiers': {
                                'type': 'array',
                                'items': {'type': 'string'},
                                'description': (
                                    "Customizations chosen from THIS item's menu "
                                    "entry using the exact option names as "
                                    "listed: the spice level as a plain number "
                                    "('0' to '5') and the protein choice verbatim "
                                    "(e.g. 'chicken'). Do NOT include anything "
                                    "that is not a listed option — put free-text "
                                    "requests in 'notes' instead."
                                ),
                            },
                        },
                        'required': ['name', 'quantity', 'price'],
                    },
                },
                'total': {
                    'type': 'number',
                    'description': 'Grand total in USD for the entire order.',
                },
                'notes': {
                    'type': 'string',
                    'description': 'Order-level notes or special requests, or empty string.',
                },
            },
            'required': ['customer_name', 'items', 'total'],
        },
    )

    end_conversation = ThinkSettingsV1FunctionsItem(
        name='end_conversation',
        description=(
            'End the conversation. Call after saying a natural goodbye — either '
            'after place_order has been called, or when the call should end '
            'without an order (customer changed their mind, wrong number, '
            'cannot be heard, etc.). Do not generate text after calling it.'
        ),
        parameters={
            'type': 'object',
            'properties': {
                'reason': {
                    'type': 'string',
                    'description': 'Why the call is ending.',
                    'enum': [
                        'order_placed',
                        'no_order_needed',
                        'customer_goodbye',
                        'unable_to_help',
                    ],
                }
            },
            'required': ['reason'],
        },
    )

    return [place_order, end_conversation]
