"use client";

import { Button, CloseButton, Dialog, Input, Portal, Text, Textarea, VStack } from '@chakra-ui/react';

type FeedbackDialogProps = {
  triggerLabel?: string;
  title?: string;
  description?: string;
  closeLabel?: string;
  submitLabel?: string;
  topicPlaceholder?: string;
  messagePlaceholder?: string;
  onSubmit?: () => void;
};

export default function FeedbackDialog({
  triggerLabel = 'Leave a Message',
  title = 'Quick Feedback',
  description = 'Tell us what was missing or unclear.',
  closeLabel = 'Close',
  submitLabel = 'Submit',
  topicPlaceholder = 'Topic',
  messagePlaceholder = 'Type your message here...',
  onSubmit,
}: FeedbackDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" colorPalette="blue">
          {triggerLabel}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="sm">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={3}>
                <Text color="fg.muted" fontSize="sm">
                  {description}
                </Text>
                <Input placeholder={topicPlaceholder} />
                <Textarea placeholder={messagePlaceholder} minH="120px" resize="vertical" />
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost">{closeLabel}</Button>
              </Dialog.ActionTrigger>
              <Button colorPalette="blue" onClick={onSubmit}>
                {submitLabel}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
