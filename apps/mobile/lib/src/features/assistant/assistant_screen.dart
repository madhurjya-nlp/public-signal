import 'package:flutter/material.dart';

class AssistantScreen extends StatelessWidget {
  const AssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ask Your Archive',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Ask what happened, compare events, or request historical context from your saved knowledge.',
          ),
          const Spacer(),
          TextField(
            minLines: 1,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Explain this simply...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              suffixIcon: IconButton(
                onPressed: () {},
                icon: const Icon(Icons.send),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

